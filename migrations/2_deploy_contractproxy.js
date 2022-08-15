const { functionInterfaceByName, removeHexPrefix, concatHexStrings } = require("../scripts/web3-utills");

const ProxyAdder = artifacts.require('ProxyAdder');
const ProxyLoupe = artifacts.require('ProxyLoupe');
const ContractProxy = artifacts.require('ContractProxy');

const str = (o) => { let v = o; try { v = JSON.stringify(o); } finally { return v; } };

module.exports = async (deployer, _, accounts) => {
  console.log(`Deploying Adder facet...`);
  await deployer.deploy(ProxyAdder);
  console.log(`Adder facet deployed at ${ProxyAdder.address}`);

  console.log(`Deploying Loupe facet...`);
  await deployer.deploy(ProxyLoupe);
  console.log(`Loupe facet deployed at ${ProxyLoupe.address}`);

  console.log(`Deploying Proxy...`)
  const proxy = {
    ownerAddr: accounts[0],
    adderAddr: ProxyAdder.address,
  };
  console.log(str(proxy));
  await deployer.deploy(ContractProxy, proxy.ownerAddr, proxy.adderAddr);
  console.log(`Proxy deployed at ${ContractProxy.address}`);

  const proxyInstance = await ContractProxy.deployed();
  const adderInstance = await ProxyAdder.deployed();
  const loupeInstance = await ProxyLoupe.deployed();

  const toContractDescriptor = (address) => ({ addr: address });
  const leBytes32Str = (str) => str.padStart(64, '0');
  const beBytes32Str = (str) => str.padEnd(64, '0');

  {
    console.log(`Adding Loupe to Proxy...`);
    console.log(`Preparing Adder.addContracts call via Proxy's fallback`);
    const loupeDescriptor = toContractDescriptor(ProxyLoupe.address);
    const encodedCall = adderInstance.contract.methods.addContracts([loupeDescriptor]).encodeABI();
    console.log(`Encoded addContractCall = ${encodedCall}`);

    const adderAddr = removeHexPrefix(ProxyAdder.address);
    console.log(`adderAddr = ${adderAddr}`);

    // function sig + addr (padded to 32 bytes) + function args
    const payload = encodedCall.slice(0, 6) + beBytes32Str(adderAddr) + encodedCall.slice(6);
    console.log(`payload = ${payload}`);
    const receipt = await web3.eth.sendTransaction({ from: accounts[0], to: ContractProxy.address, gas: '6721975', data: payload })
    console.log(str(receipt));
  }

  {
    console.log(`Fetching available facets`);
    console.log(`Preparing Loupe.contracts call via Proxy's fallback`);
    const encodedCall = loupeInstance.contract.methods.contracts().encodeABI();

    const loupeAddr = removeHexPrefix(ProxyLoupe.address);
    console.log(`loupeAddr = ${loupeAddr}`);

    const payload = encodedCall.slice(0, 6) + beBytes32Str(loupeAddr) + encodedCall.slice(6);
    const receipt = await web3.eth.call({ from: accounts[0], to: ContractProxy.address, gas: '6721975', data: payload })
    console.log(str(receipt));
  }
};
