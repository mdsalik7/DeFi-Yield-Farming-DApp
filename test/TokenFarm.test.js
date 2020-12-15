const { default: Web3 } = require('web3')

const DaiToken = artifacts.require('DaiToken')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai').use(require('chai-as-promised')).should()

//helper function

function tokens(n){
    return web3.utils.toWei(n, 'ether');
}
        //description, (accounts[0], accounts[1] of Ganache)
contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

    beforeEach( async () => {
        //loading contracts 
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all Dapp tokens to farm (1 million)
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        // Send tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    });

    describe('Mock Dai Deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, "Mock DAI Token");
        });   
    });
    describe('Dapp Token deployment', async () => {
        it('has a name', async () => {
          const name = await dappToken.name()
          assert.equal(name, 'DApp Token')
        })
    })
      describe('Token Farm deployment', async () => {
        it('has a name', async () => {
          const name = await tokenFarm.name()
          assert.equal(name, 'Dapp Token Farm')
        })
    
        it('contract has tokens', async () => {
          let balance = await dappToken.balanceOf(tokenFarm.address)
          assert.equal(balance.toString(), tokens('1000000'))
        })
      })
      describe('Farming Tokens', async () => {
        it('mDai tokens from investor to tokenFarm', async () => {
          let result
          //check investor balance before staking
          result = await daiToken.balanceOf(investor)
          assert.equal(result.toString(), tokens('100'), "Investor's mDai wallet balance correct before staking");
          
          //staking mDai tokens //calling stakeTokens() from TokenFarm.sol
          //stakeTokens() has transferFrom() which transfer dai tokens from the investor to tha TokenFarm but
          //requires approval which we ll do from the client side, frontend
          //But in order to run this test, we ll give or call the approve() from here like this we will
          //tell the dai token that the dapp tokenfarm is allowed to spend token for us so we need to call the
          //approve() inside the DaiToken.sol which takes address of tokenFarm and amount
          await daiToken.approve(tokenFarm.address, tokens('100'), {from : investor})
          await tokenFarm.stakeTokens(tokens('100'), {from : investor})

          //investor has only 100 mDai tokens to invest, after investing all he should left with 0
          result = await daiToken.balanceOf(investor)
          assert.equal(result.toString(), tokens('0'), "Investor's mDai wallet balance correct after staking");

          //after investor investing 100 dai tokens to the token farm now the TokenFarm should have 100 dai tokens
          result = await daiToken.balanceOf(tokenFarm.address)
          assert.equal(result.toString(), tokens('100'), "TokenFarm's balance correct after staking");

          //stakingBalance in TokenFarm of the investor now should be 100
          result = await tokenFarm.stakingBalance(investor)
          assert.equal(result.toString(), tokens('100'), "Investor's staking balance correct after staking");

          //isStaking status of investor in TokenFarm
          result = await tokenFarm.isStaking(investor)
          assert.equal(result.toString(), 'true', "investor's isStaking status correct after staking");

          //Issue Tokens
          await tokenFarm.issueTokens({from : owner})

          //check balance for DApp token
          result = await dappToken.balanceOf(investor)
          assert.equal(result.toString(), tokens('100'), "Investor's DApp token balance correct after issuance");

          //Only owner can issue tokens
          await tokenFarm.issueTokens({from : investor}).should.be.rejected;

          // Unstaking tokens
          await tokenFarm.unstakeTokens({ from: investor })

          // Check results after unstaking
          result = await daiToken.balanceOf(investor)
          assert.equal(result.toString(), tokens('100'), "Investor's mDai wallet balance correct after unstaking")

          result = await daiToken.balanceOf(tokenFarm.address)
          assert.equal(result.toString(), tokens('0'), "TokenFarm's balance correct after unstaking")

          result = await tokenFarm.stakingBalance(investor)
          assert.equal(result.toString(), tokens('0'), "Investor's staking balance correct after unstaking")

          result = await tokenFarm.isStaking(investor)
          assert.equal(result.toString(), 'false', "investor isStaking status correct after unstaking")
        });
      });

})