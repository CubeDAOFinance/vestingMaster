// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20("CPCT Token", "CPCT") {
    function mint(address _acount, uint256 _amount) public {
        _mint(_acount, _amount);
    }
}
