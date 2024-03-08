import BIFCoreSDK from 'bifcore-sdk-nodejs-bop'

const parseParams = (abiInputs, funArgs) => {
  const params = {}
  abiInputs.forEach((input, index) => {
    if (input.type.indexOf('json') === 0) {
      params[input.name] = JSON.parse(funArgs[index].replaceAll("'", '"'))
    } else if (input.type === 'number') {
      params[input.name] = Number(funArgs[index])
    } else if (input.type === 'number[]') {
      params[input.name] = funArgs[index].map(item => Number(item))
    } else {
      params[input.name] = funArgs[index]
    }
  })
  return params
}

export const createContract = async (selectedContract, {gasLimit, sendValue, sendUnit}, funArgs): Promise<any> => {
  const {nodeUrl, privateKey, apiKey, apiSecret} = JSON.parse(localStorage.getItem('bif') || '{}')
  const constructor = selectedContract.getConstructorInterface()
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
    apiKey, 
    apiSecret,
  })
  let params
  try {
    params = parseParams(constructor.inputs, funArgs)
  } catch (error) {
    return {code: 'ERROR', message: `params error: ${error}`}
  }
  const createContractOperation = {
    sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress,
    privateKey: privateKey,
    payload: selectedContract.compiler.deployedBytecode,
    initBalance: sendUnit === 'xht' ? (sendValue * 100000000).toString() : sendValue,
    remarks: '',
    type: 0,
    feeLimit: gasLimit.toString(),
    gasPrice: '1',
    ceilLedgerSeq: '',
    initInput: JSON.stringify(selectedContract.compiler.defaultAbi ? params['input'] : params),
  }
  const resp = await sdk.contract.createContract(createContractOperation)
  if (resp.errorCode !== 0) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }
  const txHash = resp.result.hash
  const transaction: any = await new Promise((resolve, reject) => {
    let count = 0
    const interval = setInterval(() => {
      getTransactionInfo(txHash).then((resp) => {
        console.log('getContractAddress() : ', JSON.stringify(resp))
        count++
        console.log(count)
        if (resp.errorCode === 0 || count > 60) {
          clearInterval(interval)
          resolve(resp)
        }
      })
    }, 1000)
  })
  if (transaction.errorCode !== 0) {
    return {code: 'ERROR', message: JSON.stringify(transaction)}
  }
  if (transaction.result.error_code !== 0) {
    return {code: 'ERROR', message: transaction.result.error_desc}
  }
  const newContract = JSON.parse(transaction.result.error_desc);
  return {
    code: 'SUCCESS',
    detail: {
      ...transaction.result,
      contractAddress: newContract[0].contract_address,
      logs: transaction.result.logs.map((log) => ({ ...log, address: newContract[0].contract_address })),
    },
  };
}

export const contractInvoke = async (funABI: any, funArgs: any, address: any, {gasLimit, sendValue, sendUnit}) => {
  const {nodeUrl, privateKey, apiKey, apiSecret} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
    apiKey, 
    apiSecret,
  })
  const sourceAddress = sdk.keypair.privateKeyManagerByKey(privateKey).encAddress
  let params
  try {
    params = parseParams(funABI.inputs, funArgs)
  } catch (error) {
    return {code: 'ERROR', message: `params error: ${error}`}
  }
  const contractInvokeOperation = {
    sourceAddress: sourceAddress,
    privateKey: privateKey,
    contractAddress: address,
    ceilLedgerSeq: '',
    feeLimit: gasLimit.toString(),
    gasPrice: '1',
    remarks: 'contractInvoke',
    amount: sendUnit === 'xht' ? (sendValue * 100000000).toString() : sendValue,
    input: JSON.stringify(funABI.defaultAbi ? params['input'] : {method: funABI.name, params}),
  }
  const resp = await sdk.contract.contractInvoke(contractInvokeOperation)
  if (resp.errorCode !== 0) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }
  const txHash = resp.result.hash
  const transaction: any = await new Promise((resolve, reject) => {
    let count = 0
    const interval = setInterval(() => {
      getTransactionInfo(txHash).then((resp) => {
        console.log('getTransactionInfo() : ', JSON.stringify(resp))
        count++
        console.log(count)
        if (resp.errorCode === 0 || count > 60) {
          clearInterval(interval)
          resolve(resp)
        }
      })
    }, 1000)
  })
  if (transaction.errorCode === 0) {
    return {code: 'SUCCESS', detail: {...transaction.result, logs: transaction.result.logs.map((log) => ({...log, address}))}}
  } else {
    return {code: 'ERROR', message: JSON.stringify(transaction)}
  }
}

export const getTransactionInfo = async (txHash) => {
  const {nodeUrl, apiKey, apiSecret} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
    apiKey, 
    apiSecret,
  })
  const resp = await sdk.transaction.getTransactionInfo({hash: txHash})
  if (resp.errorCode != 0) {
    return resp
  }
  const transaction = resp.result.transactions[0]
  const logs = []
  if (transaction.contract_tx_hashes) {
    for (let index = 0; index < transaction.contract_tx_hashes.length; index++) {
      const logResp = await sdk.transaction.getTransactionInfo({hash: transaction.contract_tx_hashes[index]})
      const logDatas = logResp.result.transactions[0].transaction.operations[0].log
      logs.push(logDatas)
    }
  }
  return {errorCode: 0, result: {...transaction, logs}}
}

export const contractQuery = async (funABI: any, funArgs: any, address: any) => {
  const {nodeUrl, privateKey, apiKey, apiSecret} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
    apiKey, 
    apiSecret,
  })
  let params
  try {
    params = parseParams(funABI.inputs, funArgs)
  } catch (error) {
    return {code: 'ERROR', message: `params error: ${error}`}
  }
  const contractQueryOperation = {
    sourceAddress: '',
    contractAddress: address,
    input: JSON.stringify(funABI.defaultAbi ? params['input'] : {method: funABI.name, params}),
    feeLimit: '',
    gasPrice: '',
  }
  const resp = await sdk.contract.contractQuery(contractQueryOperation)
  if (!resp.query_rets || resp.query_rets.length === 0) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }
  return {code: 'SUCCESS', detail: {sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress, queryResult: resp.query_rets[0]}}
}

export const getAccountBalance = async (nodeUrl = '', privateKey = '', apiKey = '', apiSecret = '') => {
  const bif = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl || bif.nodeUrl,
    apiKey: apiKey || bif.apiKey, 
    apiSecret: apiSecret || bif.apiSecret,
  })
  let address = ''
  try {
    address = sdk.keypair.privateKeyManagerByKey(privateKey || bif.privateKey).encAddress
  } catch (error) {
    return {code: 'ERROR', message: error.toString()}
  }
  const resp = await sdk.account.getAccountBalance({address})
  if (resp.errorCode !== 0 || resp.result.balance === undefined) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }

  return {code: 'SUCCESS', detail: resp.result.balance}
}
