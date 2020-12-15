pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./DaiToken.sol";


contract TokenFarm {

    string public name = "Dapp Token Farm";
    address public owner;
    DappToken public dappToken;
    DaiToken public daiToken;

    address[] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;


    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    //1. Stakes Token (Deposit)
    function stakeTokens(uint _amount) public {
        // Require amount greater than 0
        require(_amount>0, "amount cannot be 0");

        // Trasnfer Mock Dai tokens to this contract for staking
        daiToken.transferFrom(msg.sender, address(this), _amount);

        // Update staking balance
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        // Add user to stakers array only if they haven't staked already
        if(!hasStaked[msg.sender]){
            stakers.push(msg.sender);
        }

        // Update staking status
        hasStaked[msg.sender] = true;
        isStaking[msg.sender] = true;
    }

    //2. Issuing Token (Interest)
    function issueTokens() public {
        //only owner can call this fuction, owner is the account[0]/msg.sender which deployed the contracts
        require(msg.sender == owner, "caller must be the owner");

        //looping through the stakers array and issue them the Dapp token (Interest)
        for(uint i=0; i<stakers.length; i++){
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if(balance > 0) {
                //for 1 mDai token transfer 1 DApp token
                dappToken.transfer(recipient, balance);
            }
        }

    }
    //3. Unstaking Dai Token (Withdraw) //**WIthdrawing wat we staked and not the reward
    function unstakeTokens() public {
        //fetchin staking balance
        uint balance = stakingBalance[msg.sender];

        //require amount greater than 0
        require(balance>0, "for unstaking balance cannot be 0");

        //**Transfer mDai tokens back to the owner, not from the tokenFarm back but issuing them the same amount
        //from daiToken
        daiToken.transfer(msg.sender, balance);

        //**resetting stakingBalance of the investor in TokenFarm, since we havent really sent tokens from here
        stakingBalance[msg.sender] = 0;

        //updating staking status
        isStaking[msg.sender] = false;

    }
}
