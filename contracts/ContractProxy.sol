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

    // For this first draft I'll define two parameters for the fallback which is the address of the contract to call
    // and a single bit right after the address to indicate whether the contract is a facet or not (albeit this could be avoided
    // by keeping track of the addresses included in the proxy)
    // so the calldata layout (for calldatasize = n) it's something like:
    // bytes: [00,  03] -> delegated contract function sig
    // bytes: [04,  23] -> delegated contract address
    // bytes: [24,  24] -> if set use delegatecall else use call
    // bytes: [25,  35] -> padding
    // bytes: [36, n-1] -> delegated contract function arguments
    bytes20 requestedContractAddrBytes = bytes20(msg.data[4:24]);
    address requestedContractAddr = address(requestedContractAddrBytes);
    bytes12 flags = bytes12(msg.data[24:36]);
    bytes12 isFacet = flags >> 92; // bytelen = 12 -> 24 hexlen -> offset 23 hexchars and 4 bits = 1 hexchar -> 4 * 23 = 92
  
    assembly {
      let argumentsOffset := 36 // fallback's calldatasize minus 36 bytes (4 bytes for sig and 32 bytes for the address)
      let argumentsSize := sub(calldatasize(), argumentsOffset)
      let sigSize := 4
      calldatacopy(0, 0, sigSize) // push function sig to mem
      calldatacopy(sigSize, argumentsOffset, argumentsSize) // push function arguments to mem

      let methodCalldataSize := add(sigSize, argumentsSize)

      let g := gas()
      let a := requestedContractAddr
      let v := mul(g, 1000000000) // FIXME: This should be computed with the wei received for the transaction minus whatever wei will be used by the fallback itself
      let _in := 0
      let _insize := methodCalldataSize
      let _out := 0
      let _outsize := 0
      let result := 0
      
      switch isFacet
        case 0 {
          result := call(g, a, 0, _in, _insize, _out, _outsize) // FIXME: Pass in v as the third argument
        }
        default {
          result := delegatecall(g, a, _in, _insize, _out, _outsize)
        }
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
