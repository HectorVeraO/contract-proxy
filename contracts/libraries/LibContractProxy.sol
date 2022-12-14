// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import { IProxyAdder } from '../interfaces/IProxyAdder.sol';
import { IProxyDeployer } from '../interfaces/IProxyDeployer.sol';

library LibContractProxy {
  bytes32 constant PROXY_STORAGE_POSITION = keccak256('libcontractproxy.standard.libcontractproxy.storage');

  struct NFT {
    address owner;
    string uri;
    uint256 id;
  }

  struct ContractState {
    address addr;
    mapping(address => NFT) issuedTokenByAddr;
  }

  // Might be useful to store multiple mappings to each ContractState by id or by address
  // and to avoid duplicated data I have to find a way to store a pointer to the state
  // something like mapping(address => &ContractState) or mapping(uint256 => &ContractState)
  struct ProxyStorage {
    address owner;
    address[] contractAddresses;
    mapping(address => ContractState) contractStateByAddr;
  }

  function proxyStorage() internal pure returns (ProxyStorage storage ps_) {
    bytes32 position = PROXY_STORAGE_POSITION;

    assembly {
      ps_.slot := position
    }
  }

  event OwnershipTransferred(address indexed formerOwner, address indexed newOwner);

  function owner() internal view returns (address owner_) {
    owner_ = proxyStorage().owner;
  }

  function setOwner(address _owner) internal {
    address formerOwner = owner();
    proxyStorage().owner = _owner;

    emit OwnershipTransferred(formerOwner, _owner);
  }

  event ContractsAdded(IProxyAdder.ContractDescriptor[] _descriptors);

  function addContracts(IProxyAdder.ContractDescriptor[] memory _descriptors) internal {
    restrictOwner();

    for (uint256 i; i < _descriptors.length; i++) {
      addContract(_descriptors[i]);
    }

    emit ContractsAdded(_descriptors);
  }

  function restrictOwner() internal view {
    require(address(msg.sender) == proxyStorage().owner, 'Caller must be owner');
  }

  function restrictNonEmptyContract(address addr) internal view {
    uint256 size;
    
    assembly {
      size := extcodesize(addr)
    }

    require(size > 0, 'Contract is empty');
  }

  function addContract(IProxyAdder.ContractDescriptor memory _descriptor) private {
    restrictNonEmptyContract(_descriptor.addr);
    ProxyStorage storage ps = proxyStorage();

    // TODO: validate that contract complies with ERC721 spec

    ContractState storage cs = ps.contractStateByAddr[_descriptor.addr];
    cs.addr = _descriptor.addr;
    ps.contractAddresses.push(_descriptor.addr);
  }

  event ObjectDeployed(string name, address location);

  function deployObject(IProxyDeployer.ObjectABI calldata objectAbi) internal returns (address objectLocation_) {
    restrictOwner();

    // TODO: Validate object does not exceed 24K limit (though I don't think this is necessary)

    uint256 salt = objectAbi.salt;
    bytes memory bytecode = objectAbi.bytecode;
    address objectAddr;
    
    assembly {
      // dynamically sized byte arrays aka "bytes" have a length property
      // composed of 32 bytes and it's located right at the beginning
      // of the byte sequence representing their instances
      let wordsize := 0x20
      let bytecodeBeg := add(wordsize, bytecode) // skip length (bytecode.length)
      let bytecodeSize := mload(bytecode) // fetch bytecode.length
      let v := 0 // wei to pay, I'm poor so zero
      objectAddr := create2(v, bytecodeBeg, bytecodeSize, salt)
    }

    objectLocation_ = objectAddr;
    restrictNonEmptyContract(objectLocation_);
    emit ObjectDeployed(objectAbi.name, objectLocation_);
  }
}