// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

interface IProxyDeployer {
  struct ObjectABI {
    uint256 salt;
    string name;
    bytes bytecode;
  }

  event ObjectDeployed(string name, address location);

  function deployObject(ObjectABI calldata objectAbi) external returns (address objectLocation_);
}
