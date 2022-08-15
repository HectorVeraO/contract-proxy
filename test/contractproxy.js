const { toContractDescriptor, encodeFallbackDelegateCall, removeHexPrefix, decodeFallbackReturndata, encodeFallbackCall } = require("../scripts/web3-utills");

const ContractProxy = artifacts.require('ContractProxy');
const ProxyAdder = artifacts.require('ProxyAdder');
const ProxyLoupe = artifacts.require('ProxyLoupe');

const Dragonlore = artifacts.require('Dragonlore');
const DumbPrestigeSkin = artifacts.require('DumbPrestigeSkin');

// FIXME: For now I'll assume the proxy has been deployed
contract('ContractProxy', (accounts) => {
  const nft = { dragonlore: null, dumbPrestigeSkin: null };

  const owner = accounts[0];
  let proxyInstance = null;
  let adderInstance = null;
  let loupeInstance = null;

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
  }

  const proxycall = async (contractInstance, ...args) => {
    
  }

  const mint = async (erc721Instance, toAddr) => {
    const encodeCall = erc721Instance.contract.methods.safeMint(toAddr).encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  })
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'safeMint', returndata);
    return decoded;
  }

  const transferOwnership = async (erc721Instance, toAddr) => {
    return await erc721Instance.transferOwnership(toAddr);
    // const encodeCall = erc721Instance.contract.methods.transferOwnership(toAddr).encodeABI();
    // const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    // const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  })
    // const decoded = decodeFallbackReturndata(web3, erc721Instance, 'transferOwnership', returndata);
    // return decoded;
  }

  const ownerOf = async (erc721Instance, tokenId) => {
    const encodeCall = erc721Instance.contract.methods.ownerOf(tokenId).encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  })
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'ownerOf', returndata);
    return decoded;
  }

  const ownerOfContract = async (erc721Instance) => {
    const encodeCall = erc721Instance.contract.methods.owner().encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  })
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'owner', returndata);
    return decoded['0'];
  }

  const balanceOf = async (erc721Instance, addr) => {
    const encodeCall = erc721Instance.contract.methods.balanceOf(addr).encodeABI();
    const payload =  encodeFallbackCall(encodeCall, removeHexPrefix(erc721Instance.address));
    const returndata = await web3.eth.call({ from: owner, to: ContractProxy.address, gas: '9000000000000000', data: payload  })
    const decoded = decodeFallbackReturndata(web3, erc721Instance, 'balanceOf', returndata);
    return decoded['0'];
  }

  before(async () => {
    proxyInstance = await ContractProxy.deployed();
    adderInstance = await ProxyAdder.deployed();
    loupeInstance = await ProxyLoupe.deployed();
  });

  it('should deploy and include Dragonlore to the proxy', async () => {
    nft.dragonlore = await Dragonlore.new();
    await proxify([nft.dragonlore]);
    const managedContracts = await getManagedContracts();
    console.log(managedContracts, nft.dragonlore.address);
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
    console.log(managedContracts, nft.dumbPrestigeSkin.address);
    assert.equal(managedContracts.has(nft.dumbPrestigeSkin.address), true, `DumbPrestigeSkin is not a managed contract`);
  });

  it('should transfer ownership of DumbPrestigeSkin contract', async () => {
    await transferOwnership(nft.dumbPrestigeSkin, proxyInstance.address);
    const dpscontractOwner = await ownerOfContract(nft.dumbPrestigeSkin);
    assert.equal(dpscontractOwner, proxyInstance.address, `DumbPrestigeSkin contract should belong to ${proxyInstance.address} but it's owned by ${dpscontractOwner}`);
  });

  it('should mint a dragonlore', async () => {
    const dlowner1 = accounts[1];
    const receipt = await mint(nft.dragonlore, dlowner1);
    console.log(`Something here ${JSON.stringify(receipt)}?`);
    const balance = await balanceOf(nft.dragonlore, dlowner1);
    assert.equal(balance, 1, `${dlowner1} should own 1 dragonlore but has ${balance}`);
  });
});
