// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import { LibContractProxy } from './libraries/LibContractProxy.sol';
import { IProxyAdder } from './interfaces/IProxyAdder.sol';

contract ContractProxy {
  constructor(address _owner, address _adderAddr) {
    LibContractProxy.setOwner(_owner);
    
    IProxyAdder.ContractDescriptor[] memory descriptors = new IProxyAdder.ContractDescriptor[](1);
    descriptors[0].addr = _adderAddr;
    LibContractProxy.addContracts(descriptors);
  }
}
