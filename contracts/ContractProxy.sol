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

  fallback() external payable {
    LibContractProxy.ProxyStorage storage ps;
    bytes32 position = LibContractProxy.PROXY_STORAGE_POSITION;

    assembly {
      ps.slot := position
    }

    // TODO: assert valid call (After tests)

    // TODO: Parse and extract values to handle the dispatch
    // msg.data is a byte array of arbitrary length where every item except for the first one is padded to 32 bytes
    // item 01: function sig, 4 bytes
    // item 02: w/e, 32 bytes
    // item 03: w/e, 32 bytes and so on...

    // For this first draft I'll define a single parameter for the fallback which is the address of the contract to call
    // so the calldata layout (for calldatasize = n) it's something like:
    // bytes: [00,  03] -> delegated contract function sig
    // bytes: [04,  19] -> delegated contract address
    // bytes: [20,  35] -> padding
    // bytes: [36, n-1] -> delegated contract function arguments
    bytes20 requestedContractAddrBytes = bytes20(msg.data[4:(20 + 4)]);
    address requestedContractAddr = address(requestedContractAddrBytes);
  
    assembly {
      let argumentsOffset := 36 // fallback's calldatasize minus 36 bytes (4 bytes for sig and 32 bytes for the address)
      let argumentsSize := sub(calldatasize(), argumentsOffset)
      let sigSize := 4
      calldatacopy(0, 0, sigSize) // push function sig to mem
      calldatacopy(sigSize, argumentsOffset, argumentsSize) // push function arguments to mem

      let methodCalldataSize := add(sigSize, argumentsSize)
      let result := delegatecall(gas(), requestedContractAddr, 0, methodCalldataSize, 0, 0)
      returndatacopy(0, 0, returndatasize()) // push response to mem

      switch result
        case 0 {
          revert(0, returndatasize())
        }
        default {
          return(0, returndatasize())
        }
    }
  }

  receive() external payable {}
}
