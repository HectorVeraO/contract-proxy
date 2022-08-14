// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IProxyAdder {
  struct ContractDescriptor {
    address addr;
  }

  event ContractsAdded(ContractDescriptor[] _contracts);

  function addContracts(ContractDescriptor[] calldata _contracts) external;
}