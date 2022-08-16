const { toContractDescriptor, encodeFallbackDelegateCall, removeHexPrefix, decodeFallbackReturndata, encodeFallbackCall } = require("../scripts/web3-utills");

const ContractProxy = artifacts.require('ContractProxy');
const ProxyAdder = artifacts.require('ProxyAdder');
const ProxyLoupe = artifacts.require('ProxyLoupe');
const ProxyDeployer = artifacts.require('ProxyDeployer');

const Dragonlore = artifacts.require('Dragonlore');
const DumbPrestigeSkin = artifacts.require('DumbPrestigeSkin');
const Strawhat = artifacts.require('Strawhat');

// FIXME: For now I'll assume the proxy has been deployed
contract('ContractProxy', (accounts) => {
  const nft = { dragonlore: null, dumbPrestigeSkin: null, strawhat: null };

  const owner = accounts[0];
  let proxyInstance = null;
  let adderInstance = null;
  let loupeInstance = null;
  let deployerInstance = null;

  const proxify = async (contracts) => {
    const toAddr = (contract) => contract.address;
    const descriptors = contracts.map(toAddr).map(toContractDescriptor);
    const encodedCall = adderInstance.contract.methods.addContracts(descriptors).encodeABI();
    const payload = encodeFallbackDelegateCall(encodedCall, removeHexPrefix(adderInstance.address));
    await web3.eth.sendTransaction({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload });
  };

  const getManagedContracts = async () => {
    const encodedCall = loupeInstance.contract.methods.contracts().encodeABI();
    const payload = encodeFallbackDelegateCall(encodedCall, removeHexPrefix(loupeInstance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload });
    const decoded = decodeFallbackReturndata(web3, loupeInstance, 'contracts', returndata);
    return new Set(decoded.addresses_);
  };

  const proxycall = async (contractInstance, ...args) => {
    
  };

  const mint = async (erc721Instance, toAddr) => {
    const encodeCall = erc721Instance.contract.methods.safeMint(toAddr).encodeABI();
    console.log(`mint.encodeCall = ${JSON.stringify(encodeCall)}`);
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    console.log(`mint.payload = ${JSON.stringify(payload)}`);
    const receipt = await web3.eth.sendTransaction({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload })
    console.log(`mint.receipt = ${JSON.stringify(receipt)}`);
    return receipt;
  };

  const transferOwnership = async (erc721Instance, toAddr) => {
    return await erc721Instance.transferOwnership(toAddr);
  };

  const ownerOf = async (erc721Instance, tokenId) => {
    const encodeCall = erc721Instance.contract.methods.ownerOf(tokenId).encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  });
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'ownerOf', returndata);
    return decoded;
  };

  const ownerOfContract = async (erc721Instance) => {
    const encodeCall = erc721Instance.contract.methods.owner().encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  });
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'owner', returndata);
    return decoded['0'];
  };

  const balanceOf = async (erc721Instance, addr) => {
    const encodeCall = erc721Instance.contract.methods.balanceOf(addr).encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  });
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'balanceOf', returndata);
    return decoded['0'];
  };

  const DeployObjectAction = { CALL: 'call', TRANSACT: 'sendTransaction' };
  const deployObject = async (objectAbstraction, action = DeployObjectAction.CALL) => {
    const objectAbi = { name: 'Strawhat', salt: 0xFFFFFF, bytecode: objectAbstraction.bytecode };
    const encodeCall = deployerInstance.contract.methods.deployObject(objectAbi).encodeABI();
    const payload = encodeFallbackDelegateCall(encodeCall, removeHexPrefix(deployerInstance.address));
    let response = await web3.eth[action]({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload });
    if (DeployObjectAction.CALL === action) {
      response = decodeFallbackReturndata(web3, deployerInstance, 'deployObject', response)['0'];
      console.log(`response = ${JSON.stringify(response)}`);
    }
    return response;
  }

  before(async () => {
    proxyInstance = await ContractProxy.deployed();
    adderInstance = await ProxyAdder.deployed();
    loupeInstance = await ProxyLoupe.deployed();
    deployerInstance = await ProxyDeployer.deployed();
  });

  it('should deploy and include Dragonlore to the proxy', async () => {
    nft.dragonlore = await Dragonlore.new();
    await proxify([nft.dragonlore]);
    const managedContracts = await getManagedContracts();
    assert.equal(managedContracts.has(nft.dragonlore.address), true, `Dragonlore is not a managed contract`);
  });

  it('should transfer ownership of Dragonlore contract', async () => {
    await transferOwnership(nft.dragonlore, proxyInstance.address);
    const dlcontractOwner = await ownerOfContract(nft.dragonlore);
    assert.equal(dlcontractOwner, proxyInstance.address, `Dragonlore contract should belong to ${proxyInstance.address} but it's owned by ${dlcontractOwner}`);
  });

  it('should deploy and include DumbPrestigeSkin to the proxy', async () => {
    nft.dumbPrestigeSkin = await DumbPrestigeSkin.new();
    await proxify([nft.dumbPrestigeSkin]);
    const managedContracts = await getManagedContracts();
    assert.equal(managedContracts.has(nft.dumbPrestigeSkin.address), true, `DumbPrestigeSkin is not a managed contract`);
  });

  it('should transfer ownership of DumbPrestigeSkin contract', async () => {
    await transferOwnership(nft.dumbPrestigeSkin, proxyInstance.address);
    const dpscontractOwner = await ownerOfContract(nft.dumbPrestigeSkin);
    assert.equal(dpscontractOwner, proxyInstance.address, `DumbPrestigeSkin contract should belong to ${proxyInstance.address} but it's owned by ${dpscontractOwner}`);
  });

  it('should mint a dragonlore via proxy call', async () => {
    const dlowner1 = accounts[1];
    const receipt = await mint(nft.dragonlore, dlowner1);
    const balance = await balanceOf(nft.dragonlore, dlowner1);
    assert.equal(balance, 1, `${dlowner1} should own 1 dragonlore but has ${balance}`);
  });

  it('should mint a dumbPrestigeSkin via proxy call', async () => {
    const dpsowner1 = accounts[1];
    const receipt = await mint(nft.dumbPrestigeSkin, dpsowner1);
    const balance = await balanceOf(nft.dumbPrestigeSkin, dpsowner1);
    assert.equal(balance, 1, `${dpsowner1} should own 1 dumbPrestigeSkin but has ${balance}`);
  });

  it('should deploy Strawhat contract', async () => {
    const expectedStrawhatAddr = await deployObject(Strawhat, DeployObjectAction.CALL);
    console.log(`expectedStrawhatAddr = ${expectedStrawhatAddr}`);
    const receipt = await deployObject(Strawhat, DeployObjectAction.TRANSACT);
    nft.strawhat = await Strawhat.at(expectedStrawhatAddr);
    await proxify([nft.strawhat]);
    const managedContracts = await getManagedContracts();
    assert.equal(managedContracts.has(expectedStrawhatAddr), true, `Strawhat is not a managed contract`);
  });

  it('should mint a strawhat via proxy call', async () => {
    const mgwsowner1 = accounts[1];
    const receipt = await mint(nft.strawhat, mgwsowner1);
    const balance = await balanceOf(nft.strawhat, mgwsowner1);
    assert.equal(balance, 1, `${mgwsowner1} should own 1 strawhat but has ${balance}`);
  });
});
