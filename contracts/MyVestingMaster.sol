// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./interfaces/IVestingMaster.sol";

contract MyVestingMaster is IVestingMaster, ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    IERC20 public override vestingToken;
    //mapping(address => LockedReward[]) public override userLockedRewards;
    uint256 public immutable override period;
    uint256 public immutable override lockedPeriodAmount;
    uint256 public override totalLockedRewards;

    EnumerableSet.AddressSet private lockers;

    struct UserLockedReward{
        uint lastRewardPeriod;
        uint accTokenPerPeriod;
        uint expiredTokenPerPeriod;
        uint unlockReward;
        uint rewardDebt;
        uint lockedAmount;
        mapping(uint=>uint) lockedReward;
    }

    mapping(address => UserLockedReward) public userLockedRewards;

    event LockerAdded(address indexed locker);
    event LockerRemoved(address indexed locker);

    constructor(
        uint256 _period,
        uint256 _lockedPeriodAmount,
        address _vestingToken
    ) {
        require(
            _vestingToken != address(0),
            "VestingMaster::constructor: Zero address"
        );
        require(_period > 0, "VestingMaster::constructor: Period zero");
        require(
            _lockedPeriodAmount > 0,
            "VestingMaster::constructor: Period amount zero"
        );
        vestingToken = IERC20(_vestingToken);
        period = _period;
        lockedPeriodAmount = _lockedPeriodAmount;
    }


    function updateReward(address account) public {
        UserLockedReward storage userLockedReward = userLockedRewards[account];
        uint periodIndex = block.timestamp/period;
        if(userLockedReward.lastRewardPeriod == 0){
            userLockedReward.lastRewardPeriod = periodIndex;
            return;
        }
        userLockedReward.unlockReward += userLockedReward.accTokenPerPeriod*(periodIndex-userLockedReward.lastRewardPeriod);
        while(userLockedReward.lastRewardPeriod < periodIndex){
            userLockedReward.expiredTokenPerPeriod += userLockedReward.lockedReward[userLockedReward.lastRewardPeriod-lockedPeriodAmount]/lockedPeriodAmount;
            userLockedReward.unlockReward = userLockedReward.unlockReward.sub(userLockedReward.expiredTokenPerPeriod);
            userLockedReward.lastRewardPeriod++;
        }

    }

    function lock(
        address account, uint256 amount
    ) external override nonReentrant onlyLocker returns (bool) {

        updateReward(account);
        uint periodIndex = block.timestamp/period;
        userLockedRewards[account].lockedReward[periodIndex] += amount;
        userLockedRewards[account].lockedAmount += amount;
        userLockedRewards[account].accTokenPerPeriod += amount/lockedPeriodAmount;

        totalLockedRewards = totalLockedRewards.add(amount);
        emit Lock(account, amount);
        return true;
    }

    function claim() external override nonReentrant returns (bool) {
        address account = msg.sender;
        updateReward(account);
        (,uint claimableAmount) = getVestingAmount(account);
        userLockedRewards[account].rewardDebt += claimableAmount;
        userLockedRewards[account].lockedAmount -= claimableAmount;


        totalLockedRewards = totalLockedRewards.sub(claimableAmount);
        vestingToken.safeTransfer(account, claimableAmount);
        emit Claim(account, claimableAmount);
        return true;
    }

    function getVestingAmount(address account)
        public
        view
        override
        returns (uint256 lockedAmount, uint256 claimableAmount)
    {
        UserLockedReward storage userLockedReward = userLockedRewards[account];
        uint periodIndex = block.timestamp/period;
        if(userLockedReward.lastRewardPeriod == 0){ 
            return (0,0);
        }
        lockedAmount = userLockedReward.lockedAmount;
        uint unlockPending = userLockedReward.accTokenPerPeriod.mul(periodIndex - userLockedReward.lastRewardPeriod);
        uint expiredPending = userLockedReward.expiredTokenPerPeriod;
        uint _lastRewardPeriod = userLockedReward.lastRewardPeriod;
        while(_lastRewardPeriod < periodIndex){
            expiredPending += userLockedReward.lockedReward[_lastRewardPeriod-lockedPeriodAmount]/lockedPeriodAmount;
            unlockPending = unlockPending.sub(expiredPending);
            _lastRewardPeriod ++;
        }
        claimableAmount = userLockedReward.unlockReward.add(unlockPending).sub(userLockedReward.rewardDebt);
    }

    modifier onlyLocker() {
        require(
            lockers.contains(msg.sender),
            "VestingMaster: caller is not the locker"
        );
        _;
    }

    function addLocker(address locker) external onlyOwner {
        if (!lockers.contains(locker)) {
            lockers.add(locker);
            emit LockerAdded(locker);
        }
    }

    function removeLocker(address locker) external onlyOwner {
        if (lockers.contains(locker)) {
            lockers.remove(locker);
            emit LockerRemoved(locker);
        }
    }

    function getLocker(uint256 index) external view returns (address) {
        return lockers.at(index);
    }

    function getLockersCount() public view returns (uint256) {
        return lockers.length();
    }
}
