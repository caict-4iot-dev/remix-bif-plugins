import BIFCoreSDK from 'bifcore-sdk-nodejs'

export const createContract = async (selectedContract, {gasLimit, sendValue, sendUnit}, args): Promise<any> => {
  const {nodeUrl, privateKey} = JSON.parse(localStorage.getItem('bif') || '{}')
  const constructor = selectedContract.getConstructorInterface()
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  })
  const params = {}
  const argsObj = JSON.parse(`[${args}]`)
  constructor.inputs.forEach((input, index) => {
    params[input.name] = argsObj[index]
  })
  const createContractOperation = {
    sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress,
    privateKey: privateKey,
    payload: selectedContract.compiler.deployedBytecode,
    initBalance: sendUnit === 'XHT' ? (sendValue * 100000000).toString() : sendValue,
    remarks: '',
    type: 0,
    feeLimit: gasLimit.toString(),
    gasPrice: '1',
    ceilLedgerSeq: '',
    initInput: JSON.stringify(params),
  }
  console.log(createContractOperation)
  const resp = await sdk.contract.createContract(createContractOperation)
  console.log('createContract() : ', JSON.stringify(resp))
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
  if (transaction.errorCode === 0) {
    const newContract = JSON.parse(transaction.result.error_desc)
    return {
      code: 'SUCCESS',
      detail: {
        ...transaction.result,
        contractAddress: newContract[0].contract_address,
        logs: transaction.result.logs.map((log) => ({...log, address: newContract[0].contract_address})),
      },
    }
  } else {
    return {code: 'ERROR', message: '合约部署失败'}
  }
}

export const contractInvoke = async (funABI: any, value: any, address: any) => {
  const {nodeUrl, privateKey} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  })
  const sourceAddress = sdk.keypair.privateKeyManagerByKey(privateKey).encAddress
  const params = {}
  const argsObj = JSON.parse(`[${value}]`)
  funABI.inputs.forEach((input, index) => {
    params[input.name] = argsObj[index]
  })
  const contractInvokeOperation = {
    sourceAddress: sourceAddress,
    privateKey: privateKey,
    contractAddress: address,
    ceilLedgerSeq: '',
    feeLimit: '1002088010',
    gasPrice: '1',
    remarks: 'contractInvoke',
    amount: '0',
    input: JSON.stringify({method: funABI.name, params}),
  }
  const resp = await sdk.contract.contractInvoke(contractInvokeOperation)
  console.log('contractInvoke() : ', JSON.stringify(resp))
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
    return {code: 'ERROR', message: '合约部署失败'}
  }
}

export const getTransactionInfo = async (txHash) => {
  const {nodeUrl} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
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

export const contractQuery = async (funABI: any, value: any, address: any) => {
  const {nodeUrl, privateKey} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  })
  const params = {}
  const argsObj = JSON.parse(`[${value}]`)
  funABI.inputs.forEach((input, index) => {
    params[input.name] = argsObj[index]
  })
  const contractQueryOperation = {
    sourceAddress: '',
    contractAddress: address,
    input: JSON.stringify({method: funABI.name, params}),
    feeLimit: '',
    gasPrice: '',
  }
  const data = await sdk.contract.contractQuery(contractQueryOperation)
  console.log('contractQuery() : ', JSON.stringify(data))
  return {code: 'SUCCESS', detail: {sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress, queryResult: data.query_rets[0].result}}
}

export const getAccountBalance = async () => {
  const {nodeUrl, privateKey} = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  })
  const resp = await sdk.account.getAccountBalance({address: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress})
  if (resp.errorCode != 0) {
    return 0
  }

  return resp.result.balance
}
