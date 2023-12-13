import {execution} from '@remix-project/remix-lib'
import {logKnownTransaction, logViewOnExplorer, setBif} from '../actions'
import {EventsDecoder} from './eventsDecoder'
import {createContract, contractInvoke, contractQuery} from './bif-service'

const {txFormat, txHelper} = execution

const eventsDecoder = new EventsDecoder()

function inputParametersExtraction() {
  return /64697066735822[0-9a-f]{68}64736f6c6343[0-9a-f]{6}0033(.*)$/
}

function getinputParameters(value) {
  const regex = value.match(inputParametersExtraction())
  if (regex && regex[1]) {
    return regex[1]
  } else return ''
}

async function deployContract(selectedContract, {gasLimit, sendValue, sendUnit}, args, contractMetadata, callbacks, confirmationCb) {
  const {continueCb, promptCb, statusCb, finalCb} = callbacks
  setBif({txStatus: 'pending'})
  statusCb(`creation of ${selectedContract.name} pending...`)
  const funArgs = eventsDecoder._parseFunctionParams(args)
  const resp = await createContract(selectedContract, {gasLimit, sendValue, sendUnit}, funArgs)
  setBif({txStatus: 'finished'})
  if (resp.code !== 'SUCCESS') {
    return statusCb(`creation of ${selectedContract.name} errored: ${resp.message}`);
  }
  finalCb(null, selectedContract, resp.detail.contractAddress)
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
      receipt: {status: '0x1', contractAddress: resp.detail.contractAddress},
      resolvedData: {
        contractName: selectedContract.name,
        to: null,
        fn: '(constructor)',
        params: eventsDecoder._parseInputParams(funArgs, selectedContract.getConstructorInterface()),
        contractAddress: resp.detail.contractAddress,
      },
      logs: {decoded: resp.detail.logs, raw: resp.detail.logs},
    },
    provider: 'bif',
  })
  logViewOnExplorer(resp.detail.hash)
}

async function runOrCallContractMethod(contractName: any, {gasLimit, sendValue, sendUnit}, contractAbi: any, funABI: any, contract: any, value: any, address: any, callType: any, lookupOnly: any, logMsg: any, logCallback: any, outputCb: any, confirmationCb: any, continueCb: any, promptCb: any) {
  if (!lookupOnly) {
    setBif({txStatus: 'pending'})
    logCallback(`${logMsg} pending ... `)
  } else {
    logCallback(`${logMsg}`)
  }
  const useCall = funABI.stateMutability === 'view' || funABI.stateMutability === 'pure'
  const funArgs = eventsDecoder._parseFunctionParams(value)
  if (useCall) {
    const resp: any = await contractQuery(funABI, funArgs, address)
    if (resp.code !== 'SUCCESS') {
      return logCallback(`${logMsg} errored: ${resp.message}`);
    }
    if (resp.detail.queryResult.error) {
      logCallback(`${logMsg} errored: ${JSON.stringify(resp.detail.queryResult.error)}`);
    }
    outputCb(resp.detail.queryResult.result)
    logKnownTransaction({
      type: 'knownTransaction',
      value: {
        tx: { isCall: true, input: value, to: address, from: resp.detail.sourceAddress, contractAddress: address, hash: `${address}${funABI.name}${Date.now()}` },
        resolvedData: {
          contractName: contractName,
          to: address,
          fn: funABI.name,
          params: eventsDecoder._parseInputParams(funArgs, funABI),
          decodedReturnValue: resp.detail.queryResult.result,
        },
      },
      provider: 'bif',
    })
  } else {
    const resp = await contractInvoke(funABI, funArgs, address, {gasLimit, sendValue, sendUnit})
    setBif({txStatus: 'finished'})
    if (resp.code !== 'SUCCESS') {
      return logCallback(`${logMsg} errored: ${resp.message}`);
    }
    if (resp.detail.error_code !== 0) {
      logCallback(`${logMsg} errored: ${resp.detail.error_desc}`);
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
        receipt: {status: resp.detail.error_code === 0 ? '0x1' : '0x0', contractAddress: address},
        resolvedData: {
          contractName: contractName,
          to: address,
          fn: funABI.name,
          params: eventsDecoder._parseInputParams(funArgs, funABI),
        },
        logs: {decoded: resp.detail.logs, raw: resp.detail.logs},
      },
      provider: 'bif',
    })
    logViewOnExplorer(resp.detail.hash)
  }
}

export default {
  deployContract,
  runOrCallContractMethod,
}
