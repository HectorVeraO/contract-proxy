// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IProxyLoupe {
  function contracts() external view returns(address[] memory addresses_);
}