// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import { IProxyDeployer } from '../interfaces/IProxyDeployer.sol';
import { LibContractProxy } from '../libraries/LibContractProxy.sol';

contract ProxyDeployer is IProxyDeployer {
  function deployObject(ObjectABI calldata objectAbi) external override returns (address objectLocation_) {
    LibContractProxy.restrictOwner();
    objectLocation_ = LibContractProxy.deployObject(objectAbi);
  }
}
