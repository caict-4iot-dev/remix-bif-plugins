var remixLib = require('@remix-project/remix-lib')
var EventsDecoder = remixLib.execution.EventsDecoder

export function makeUdapp(blockchain, plugin) {
  // ----------------- Tx listener -----------------
  const _transactionReceipts = {};
  const transactionReceiptResolver = (tx, cb) => {
    if (_transactionReceipts[tx.hash]) {
      return cb(null, _transactionReceipts[tx.hash])
    }
    let res = blockchain.web3().eth.getTransactionReceipt(tx.hash, (error, receipt) => {
      if (error) {
        return cb(error)
      }
      _transactionReceipts[tx.hash] = receipt
      cb(null, receipt)
    })
    if(res && typeof res.then ==='function'){
      res.then((receipt)=>{
        _transactionReceipts[tx.hash] = receipt
        cb(null, receipt)
      }).catch((error)=>{
        cb(error)
      })
    }
  }

  const txlistener = blockchain.getTxListener({
    api: {
      contracts: function () {
        if (plugin.compilersArtefacts.__last) return plugin.compilersArtefacts.getAllContractDatas();
        return null;
      },
      resolveReceipt: transactionReceiptResolver,
    },
  });

  blockchain.startListening(txlistener);
  const eventsDecoder = new EventsDecoder({
    resolveReceipt: transactionReceiptResolver,
  });
  txlistener.startListening();
  plugin.eventsDecoder = eventsDecoder;
  plugin.txListener = txlistener;

  const log = async (plugin, tx, receipt) => {
    const resolvedTransaction = await plugin.txListener.resolvedTransaction(tx.hash);
    const provider = blockchain.getProvider();

    if (resolvedTransaction) {
      let compiledContracts = null;
      try {
        if (tx.to) {
          compiledContracts = plugin.compilersArtefacts.get(tx.to).data.contracts;
        }
      } catch (error) {
        console.log(error);
      }

      try {
        const currentFile = await plugin.call('fileManager', 'getCurrentFile');
        if (!compiledContracts && currentFile && currentFile.endsWith('.sol')) {
          compiledContracts = (await plugin.compilersArtefacts.getCompilerAbstract(currentFile)).data.contracts;
        }
      } catch (error) {
        console.log(error);
      }

      if (!compiledContracts) {
        compiledContracts = plugin.compilersArtefacts.getLastCompilationResult().data.contracts;
      }

      await plugin.eventsDecoder.parseLogs(tx, resolvedTransaction.contractName, compiledContracts, async (error, logs) => {
        if (!error) {
          await plugin.call('terminal', 'log', {
            type: 'knownTransaction',
            value: { tx: tx, receipt: receipt, resolvedData: resolvedTransaction, logs: logs },
            provider,
          });
        }
      });
    } else {
      await plugin.call('terminal', 'log', { type: 'unknownTransaction', value: { tx: tx, receipt: receipt }, provider });
    }
  };

  txlistener.event.register('newCall', (tx, receipt) => {
    log(plugin, tx, receipt);
  });

  txlistener.event.register('newTransaction', (tx, receipt) => {
    log(plugin, tx, receipt);
  });
}
