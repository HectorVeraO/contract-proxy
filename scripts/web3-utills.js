const functions = (interfaceMember) => interfaceMember.type === 'function';

const methodsOf = (contract) => contract.abi.filter(functions);

const sighashOf = (interfaceMember) => interfaceMember.signature;

const toSighash = sighashOf;

const selectorsOf = (contract) => methodsOf(contract).map(toSighash);

const reducer = {
  toMap: (col, keyMapper, valueMapper) => {
    return col.reduce(
      (dict, curr) => { dict.set(keyMapper(curr), valueMapper(curr)); return dict; },
      new Map(),
    );
  }
};

const functionInterfaceByName = (contract) => reducer.toMap(methodsOf(contract), (o) => o.name, (o) => o);

const hexPrefix = '0x';

const removeHexPrefix = (hexstr) => hexstr.startsWith(hexPrefix) ? hexstr.slice(hexPrefix.length) : hexstr;

const concatHexStrings = (...hexstrs) => `0x${hexstrs.map(removeHexPrefix).join('')}`;

const toContractDescriptor = (address) => ({ addr: address });

const leBytes32Str = (str) => str.padStart(64, '0');

const beBytes32Str = (str) => str.padEnd(64, '0');

const encodeFallbackCall = (fcall, caddr) => concatHexStrings(fcall.slice(0, 10), beBytes32Str(caddr + '0'), fcall.slice(10));

const encodeFallbackDelegateCall = (fcall, caddr) => concatHexStrings(fcall.slice(0, 10), beBytes32Str(caddr + '1'), fcall.slice(10));


const decodeFallbackReturndata = (web3, contract, methodName, returndata) => {
  const interface = contract.abi.filter(interface => interface.name === methodName)[0];
  const returnTypes = interface.outputs;
  return web3.eth.abi.decodeParameters(returnTypes, returndata);
};

module.exports = {
  functions,
  methodsOf,
  sighashOf,
  toSighash,
  selectorsOf,
  reducer,
  functionInterfaceByName,
  removeHexPrefix,
  concatHexStrings,
  toContractDescriptor,
  leBytes32Str,
  beBytes32Str,
  encodeFallbackCall,
  encodeFallbackDelegateCall,
  decodeFallbackReturndata,
};
