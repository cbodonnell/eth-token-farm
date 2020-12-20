pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./DaiToken.sol";

contract TokenFarm {
    address public owner;
    string public name = "Dapp Token Farm";
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

    function stakeTokens(uint _amount) public {
        require(_amount > 0, "amount cannot be 0");

        // Transfer Mock Dai tokens to this contract for staking
        daiToken.transferFrom(msg.sender, address(this), _amount);

        // Update staking balance of the sender
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        // Add sender to stakers array *only* if they haven't staked already
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }
        
        // Update staking status of sender
        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true;
    }

    function unstakeTokens() public {
        uint balance = stakingBalance[msg.sender];
        require(balance > 0, "staking balance cannot be 0");
        daiToken.transfer(msg.sender, balance);
        stakingBalance[msg.sender] = 0;
        isStaking[msg.sender] = false;
    }

    function issueTokens() public {
        require(msg.sender == owner, "caller must be the owner");

        for (uint i = 0; i < stakers.length; i++) {
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if (balance > 0) {
                dappToken.transfer(recipient, balance);
            }
        }
    }
}