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
    initBalance: sendUnit === 'XHT' ? (sendValue * 100000000).toString() : sendValue,
    remarks: '',
    type: 1,
    feeLimit: gasLimit.toString(),
    gasPrice: '1',
    ceilLedgerSeq: '',
    initInput: '',
  };
  console.log(createContractOperation);
  const resp = await sdk.contract.createContract(createContractOperation);
  console.log('createContract() : ', JSON.stringify(resp));
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
      });
    }, 1000);
  });
  if (transaction.errorCode === 0) {
    const newContract = JSON.parse(transaction.result.error_desc);
    return {
      code: 'SUCCESS',
      detail: {
        ...transaction.result,
        contractAddress: newContract[0].contract_address,
        logs: transaction.result.logs.map((log) => ({ ...log, address: newContract[0].contract_address })),
      },
    };
  } else {
    return { code: 'ERROR', message: '合约部署失败' };
  }
};

export const contractInvoke = async (funABI: any, value: any, address: any, dataHex: any) => {
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
    feeLimit: '1002088010',
    gasPrice: '1',
    remarks: 'contractInvoke',
    amount: '0',
    input: dataHex,
  };
  const resp = await sdk.contract.contractInvoke(contractInvokeOperation);
  console.log('contractInvoke() : ', JSON.stringify(resp));
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
      });
    }, 1000);
  });
  if (transaction.errorCode === 0) {
    return { code: 'SUCCESS', detail: { ...transaction.result, logs: transaction.result.logs.map((log) => ({ ...log, address })) } };
  } else {
    return { code: 'ERROR', message: '合约部署失败' };
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
      const logDatas = logResp.result.transactions[0].transaction.operations[0].log.datas;
      logs.push(JSON.parse(logDatas));
    }
    logs.forEach((log) => {
      log.data = '0x' + log.data;
      log.topics[0] = '0x' + log.topics[0];
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
  const data = await sdk.contract.contractQuery(contractQueryOperation);
  console.log('contractQuery() : ', JSON.stringify(data));
  return { code: 'SUCCESS', detail: { sourceAddress: sdk.keypair.privateKeyManagerByKey(privateKey).encAddress, queryResult: data.query_rets[0].result.data } };
};
