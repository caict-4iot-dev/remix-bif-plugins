import { execution } from '@remix-project/remix-lib';
import { logKnownTransaction, logViewOnExplorer } from '../actions';
import { EventsDecoder } from './eventsDecoder';
import { createContract, contractInvoke, contractQuery } from './bif-service';

const { txFormat, txHelper } = execution;

const eventsDecoder = new EventsDecoder();

function inputParametersExtraction() {
  return /64697066735822[0-9a-f]{68}64736f6c6343[0-9a-f]{6}0033(.*)$/;
}

function getinputParameters(value) {
  const regex = value.match(inputParametersExtraction());
  if (regex && regex[1]) {
    return regex[1];
  } else return '';
}

async function deployContract(selectedContract, { gasLimit, sendValue, sendUnit }, args, contractMetadata, compilerContracts, callbacks, confirmationCb) {
  const { continueCb, promptCb, statusCb, finalCb } = callbacks;
  const constructor = selectedContract.getConstructorInterface();
  txFormat.buildData(
    selectedContract.name,
    selectedContract.object,
    compilerContracts,
    true,
    constructor,
    args,
    async (error, data) => {
      console.log(data);
      if (error) {
        return statusCb(`creation of ${selectedContract.name} errored: ${error.message ? error.message : error}`);
      }

      statusCb(`creation of ${selectedContract.name} pending...`);
      const resp = await createContract(selectedContract, { gasLimit, sendValue, sendUnit }, args, { contractBytecode: data.contractBytecode, dataHex: data.dataHex });
      if (resp.code !== 'SUCCESS') {
        return statusCb(`creation of ${selectedContract.name} errored: ${resp.message}`);
      }
      eventsDecoder.parseLogs({}, { logs: resp.detail.logs }, selectedContract.name, compilerContracts, (error, logs) => {
        if (error) {
          statusCb(`creation of ${selectedContract.name} errored: ${error}`);
          return;
        }
        finalCb(null, selectedContract, resp.detail.contractAddress);
        logKnownTransaction({
          type: 'knownTransaction',
          value: {
            tx: {
              hash: resp.detail.hash,
              isCall: false,
              blockNumber: resp.detail.ledger_seq,
              transactionCost: resp.detail.actual_fee,
              from: resp.detail.transaction.source_address,
              to: null,
              transactionIndex: resp.detail.transaction.nonce,
            },
            receipt: { status: '0x1', contractAddress: resp.detail.contractAddress },
            resolvedData: {
              contractName: selectedContract.name,
              to: null,
              fn: '(constructor)',
              // params: eventsDecoder._decodeInputParams(getinputParameters(data.dataHex.replace(data.contractBytecode, '')), txHelper.getConstructorInterface(selectedContract.abi)),
              params: eventsDecoder._parseInputParams(data.funArgs, txHelper.getConstructorInterface(selectedContract.abi)),
              contractAddress: resp.detail.contractAddress,
            },
            logs: logs,
          },
          provider: 'bif',
        });
        logViewOnExplorer('http://test-bj-explorer.bitfactory.cn', resp.detail.hash);
      });
    },
    statusCb,
    () => {},
  );
}

async function runOrCallContractMethod(
  contractName: any,
  {gasLimit, sendValue, sendUnit},
  contractAbi: any,
  funABI: any,
  contract: any,
  value: any,
  address: any,
  callType: any,
  lookupOnly: any,
  logMsg: any,
  logCallback: any,
  outputCb: any,
  confirmationCb: any,
  continueCb: any,
  promptCb: any,
  compilerContracts: any,
) {
  txFormat.buildData(
    contractName,
    contractAbi,
    {},
    false,
    funABI,
    callType,
    async (error, data) => {
      if (error) {
        return logCallback(`${logMsg} errored: ${error.message ? error.message : error}`);
      }
      if (!lookupOnly) {
        logCallback(`${logMsg} pending ... `);
      } else {
        logCallback(`${logMsg}`);
      }
      if (funABI.type === 'fallback') data.dataHex = value;

      if (data) {
        data.contractName = contractName;
        data.contractABI = contractAbi;
        data.contract = contract;
      }
      const useCall = funABI.stateMutability === 'view' || funABI.stateMutability === 'pure';
      if (useCall) {
        const resp: any = await contractQuery(funABI, value, address, data.dataHex);
        if (resp.code !== 'SUCCESS') {
          return logCallback(`${logMsg} errored: ${resp.message}`);
        }
        outputCb(resp.detail.queryResult.data);
        logKnownTransaction({
          type: 'knownTransaction',
          value: {
            tx: { isCall: true, input: value, to: address, from: resp.detail.sourceAddress, contractAddress: address, hash: `${address}${funABI.name}${Date.now()}` },
            resolvedData: {
              contractName: contractName,
              to: address,
              fn: funABI.name,
              params: eventsDecoder._decodeInputParams(data.dataHex.replace('0x', '').substring(8), funABI),
              decodedReturnValue: txFormat.decodeResponse(resp.detail.queryResult.data, funABI),
            },
          },
          provider: 'bif',
        });
      } else {
        const resp = await contractInvoke(funABI, value, address, data.dataHex, {gasLimit, sendValue, sendUnit});
        if (resp.code !== 'SUCCESS') {
          return logCallback(`${logMsg} errored: ${resp.message}`);
        }
        if (resp.detail.error_code !== 0) {
          logCallback(`${logMsg} errored: ${resp.detail.error_desc}`);
        }
        eventsDecoder.parseLogs({}, { logs: resp.detail.logs }, contractName, compilerContracts, (error, logs) => {
          if (error) {
            logCallback(`${error}`);
            return;
          }
          logKnownTransaction({
            type: 'knownTransaction',
            value: {
              tx: {
                hash: resp.detail.hash,
                isCall: useCall,
                blockNumber: resp.detail.ledger_seq,
                transactionCost: resp.detail.actual_fee,
                from: resp.detail.transaction.source_address,
                to: address,
                transactionIndex: resp.detail.transaction.nonce,
              },
              receipt: { status: resp.detail.error_code === 0 ? '0x1' : '0x0', contractAddress: address },
              resolvedData: {
                contractName: contractName,
                to: address,
                fn: funABI.name,
                params: eventsDecoder._decodeInputParams(data.dataHex.replace('0x', '').substring(8), funABI),
              },
              logs: logs,
            },
            provider: 'bif',
          });
          logViewOnExplorer('http://test-bj-explorer.bitfactory.cn', resp.detail.hash);
        });
      }
    },
    (msg) => {
      logCallback(msg);
    },
    () => {},
  );
}

export default {
  deployContract,
  runOrCallContractMethod,
};
