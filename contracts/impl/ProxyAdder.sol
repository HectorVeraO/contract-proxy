// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import { IProxyAdder } from '../interfaces/IProxyAdder.sol';
import { LibContractProxy } from '../libraries/LibContractProxy.sol';

contract ProxyAdder is IProxyAdder {
  function addContracts(ContractDescriptor[] calldata _descriptors) external override {
    LibContractProxy.restrictOwner();
    LibContractProxy.addContracts(_descriptors);
  }
}
