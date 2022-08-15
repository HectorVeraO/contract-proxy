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
};
