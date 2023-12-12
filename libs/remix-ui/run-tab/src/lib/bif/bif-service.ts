import BIFCoreSDK from 'bifcore-sdk-nodejs';

export const createContract = async (selectedContract, { gasLimit, sendValue, sendUnit }, args, { contractBytecode, dataHex }): Promise<any> => {
  const { nodeUrl, privateKey } = JSON.parse(localStorage.getItem('bif') || '{}');
  const constructor = selectedContract.getConstructorInterface();
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  });
  const createContractOperation = {
    sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress,
    privateKey: privateKey,
    payload: dataHex,
    initBalance: sendUnit === 'xht' ? (sendValue * 100000000).toString() : sendValue,
    remarks: '',
    type: 1,
    feeLimit: gasLimit.toString(),
    gasPrice: '1',
    ceilLedgerSeq: '',
    initInput: '',
  };
  const resp = await sdk.contract.createContract(createContractOperation);
  if (resp.errorCode !== 0) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }
  const txHash = resp.result.hash;
  const transaction: any = await new Promise((resolve, reject) => {
    let count = 0;
    const interval = setInterval(() => {
      getTransactionInfo(txHash).then((resp) => {
        console.log('getContractAddress() : ', JSON.stringify(resp));
        count++;
        console.log(count);
        if (resp.errorCode === 0 || count > 60) {
          clearInterval(interval);
          resolve(resp);
        }
      }).catch(error => {
        resolve({error});
      });
    }, 1000);
  });
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
};

export const contractInvoke = async (funABI: any, value: any, address: any, dataHex: any, {gasLimit, sendValue, sendUnit}) => {
  const { nodeUrl, privateKey } = JSON.parse(localStorage.getItem('bif') || '{}');
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  });
  const sourceAddress = sdk.keypair.privateKeyManagerByKey(privateKey).encAddress;
  const contractInvokeOperation = {
    sourceAddress: sourceAddress,
    privateKey: privateKey,
    contractAddress: address,
    ceilLedgerSeq: '',
    feeLimit: gasLimit.toString(),
    gasPrice: '1',
    remarks: 'contractInvoke',
    amount: sendUnit === 'xht' ? (sendValue * 100000000).toString() : sendValue,
    input: dataHex,
  };
  const resp = await sdk.contract.contractInvoke(contractInvokeOperation);
  if (resp.errorCode !== 0) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }
  const txHash = resp.result.hash;
  const transaction: any = await new Promise((resolve, reject) => {
    let count = 0;
    const interval = setInterval(() => {
      getTransactionInfo(txHash).then((resp) => {
        console.log('getTransactionInfo() : ', JSON.stringify(resp));
        count++;
        console.log(count);
        if (resp.errorCode === 0 || count > 60) {
          clearInterval(interval);
          resolve(resp);
        }
      }).catch(error => {
        resolve({error});
      });
    }, 1000);
  });
  if (transaction.errorCode === 0) {
    return { code: 'SUCCESS', detail: { ...transaction.result, logs: transaction.result.logs.map((log) => ({ ...log, address })) } };
  } else {
    return {code: 'ERROR', message: JSON.stringify(transaction)}
  }
};

export const getTransactionInfo = async (txHash) => {
  const { nodeUrl } = JSON.parse(localStorage.getItem('bif') || '{}');
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  });
  const resp = await sdk.transaction.getTransactionInfo({ hash: txHash });
  if (resp.errorCode != 0) {
    return resp;
  }
  const transaction = resp.result.transactions[0];
  const logs = [];
  if (transaction.contract_tx_hashes) {
    for (let index = 0; index < transaction.contract_tx_hashes.length; index++) {
      const logResp = await sdk.transaction.getTransactionInfo({ hash: transaction.contract_tx_hashes[index] });
      const operation = logResp.result.transactions[0].transaction.operations[0]
      if (operation.log && operation.log.datas) {
        const logDatas = JSON.parse(operation.log.datas)
        if (logDatas.data && logDatas.topics) {
          logs.push(logDatas)
        }
      }
      // const logDatas = logResp.result.transactions[0].transaction.operations[0].log.datas;
      // logs.push(JSON.parse(logDatas));
    }
    logs.forEach((log) => {
      log.data = '0x' + log.data;
      log.topics = log.topics.map((topic) => '0x' + topic);
    });
  }
  return { errorCode: 0, result: { ...transaction, logs } };
};

export const contractQuery = async (funABI: any, value: any, address: any, dataHex: any) => {
  const { nodeUrl, privateKey } = JSON.parse(localStorage.getItem('bif') || '{}');
  const sdk = new BIFCoreSDK({
    host: nodeUrl,
  });
  const contractQueryOperation = {
    sourceAddress: '',
    contractAddress: address,
    input: dataHex,
    feeLimit: '',
    gasPrice: '',
  };
  const resp = await sdk.contract.contractQuery(contractQueryOperation)
  if (!resp.query_rets || resp.query_rets.length === 0) {
    return {code: 'ERROR', message: JSON.stringify(resp)}
  }
  return {code: 'SUCCESS', detail: {sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress, queryResult: resp.query_rets[0] ? resp.query_rets[0].result : { data: null }}}
}

export const getAccountBalance = async (nodeUrl = '', privateKey = '') => {
  const bif = JSON.parse(localStorage.getItem('bif') || '{}')
  const sdk = new BIFCoreSDK({
    host: nodeUrl || bif.nodeUrl,
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