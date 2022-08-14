// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import { IProxyLoupe } from '../interfaces/IProxyLoupe.sol';
import { LibContractProxy } from '../libraries/LibContractProxy.sol';

contract ProxyLoupe is IProxyLoupe {
  function contracts() external override view returns(address[] memory addresses_) {
    addresses_ = LibContractProxy.proxyStorage().contractAddresses;
  }
}