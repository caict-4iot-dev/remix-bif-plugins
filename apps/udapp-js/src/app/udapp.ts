import { PluginClient } from '@remixproject/plugin';
import { createClient } from '@remixproject/plugin-webview';
import { NetworkModule } from '@remixproject/network-module';
import { execution, Storage } from '@remix-project/remix-lib';
import { CompilerArtefacts } from '@remix-project/core-plugin';
import { Blockchain } from '@remixproject/blockchain';
import { makeUdapp } from '@remixproject/udapp'
import Config from '@remixproject/config'

const { EventsDecoder } = execution;

export class UdappClientApi extends PluginClient {
  blockchain: any;
  compilersArtefacts: any;
  networkModule: any;
  config: any;
  REACT_API: any;
  constructor() {
    super();
    createClient(this as any);
    // setup storage
    const configStorage = new Storage('config-v0.8:');
    // load app config
    this.config = new Config(configStorage);
    // this.blockchain = new Blockchain(this);
    this.compilersArtefacts = new CompilerArtefacts(this);
    // makeUdapp(this.blockchain, this);
    // this.networkModule = new NetworkModule(this.blockchain);
  }

  onReady(api) {
    this.REACT_API = api;
  }

  async onInitDone() {
    const addProvider = async (name, displayName, isInjected, isVM, fork = '', dataId = '', title = '') => {
      await this.blockchain.addProvider({
        options: {},
        dataId,
        name,
        displayName,
        fork,
        isInjected,
        isVM,
        title,
        init: async function () {
          const options = await this.call(name, 'init');
          if (options) {
            this.options = options;
            if (options['fork']) this.fork = options['fork'];
          }
        },
        provider: {
          async sendAsync(payload, callback) {
            try {
              const result = await this.call(name, 'sendAsync', payload);
              callback(null, result);
            } catch (e) {
              callback(e);
            }
          },
        },
      });
    };

    // VM
    const titleVM = 'Execution environment is local to Remix.  Data is only saved to browser memory and will vanish upon reload.';
    await addProvider('vm-shanghai', 'Remix VM (Shanghai)', false, true, 'shanghai', 'settingsVMShanghaiMode', titleVM);
    await addProvider('vm-merge', 'Remix VM (Merge)', false, true, 'merge', 'settingsVMMergeMode', titleVM);
    await addProvider('vm-london', 'Remix VM (London)', false, true, 'london', 'settingsVMLondonMode', titleVM);
    await addProvider('vm-berlin', 'Remix VM (Berlin)', false, true, 'berlin', 'settingsVMBerlinMode', titleVM);
    await addProvider('vm-mainnet-fork', 'Remix VM - Mainnet fork', false, true, 'merge', 'settingsVMMainnetMode', titleVM);
    await addProvider('vm-sepolia-fork', 'Remix VM - Sepolia fork', false, true, 'merge', 'settingsVMSepoliaMode', titleVM);
    await addProvider('vm-goerli-fork', 'Remix VM - Goerli fork', false, true, 'merge', 'settingsVMGoerliMode', titleVM);
    await addProvider('vm-custom-fork', 'Remix VM - Custom fork', false, true, '', 'settingsVMCustomMode', titleVM);

    // external provider
    await addProvider('basic-http-provider', 'Custom - External Http Provider', false, false);
    await addProvider('hardhat-provider', 'Dev - Hardhat Provider', false, false);
    await addProvider('ganache-provider', 'Dev - Ganache Provider', false, false);
    await addProvider('foundry-provider', 'Dev - Foundry Provider', false, false);

    // injected provider
    await addProvider('injected-optimism-provider', 'L2 - Optimism Provider', true, false);
    await addProvider('injected-arbitrum-one-provider', 'L2 - Arbitrum One Provider', true, false);

    await addProvider('walletconnect', 'WalletConnect', false, false);
  }

  async askPermission(method, params) {
    console.log('askPermission', method, params);
    return true;
  }

  sendAsync(payload) {
    return new Promise((resolve, reject) => {
      this.askPermission('sendAsync', `Calling ${payload.method} with parameters ${JSON.stringify(payload.params, null, '\t')}`)
        .then(async (result) => {
          if (result) {
            const provider = this.blockchain.web3().currentProvider;
            // see https://github.com/ethereum/web3.js/pull/1018/files#diff-d25786686c1053b786cc2626dc6e048675050593c0ebaafbf0814e1996f22022R129
            provider[provider.sendAsync ? 'sendAsync' : 'send'](payload, async (error, message) => {
              if (error) {
                // Handle 'The method "debug_traceTransaction" does not exist / is not available.' error
                if (error.message && error.code && error.code === -32601) {
                  this.call('terminal', 'log', { value: error.message, type: 'error' });
                  return reject(error.message);
                } else {
                  const errorData = error.data || error.message || error;
                  // See: https://github.com/ethers-io/ethers.js/issues/901
                  if (!(typeof errorData === 'string' && errorData.includes('unknown method eth_chainId')))
                    this.call('terminal', 'log', { value: error.data || error.message, type: 'error' });
                  return reject(errorData);
                }
              }
              if (payload.method === 'eth_sendTransaction') {
                if (payload.params.length && !payload.params[0].to && message.result) {
                  setTimeout(async () => {
                    const receipt = await this.tryTillReceiptAvailable(message.result);
                    if (!receipt.contractAddress) {
                      console.log('receipt available but contract address not present', receipt);
                      return;
                    }
                    const contractData = await this.compilersArtefacts.getContractDataFromAddress(receipt.contractAddress);
                    if (contractData) {
                      this.emit('addInstanceReducer', receipt.contractAddress, contractData.contract.abi, contractData.name);
                    }
                  }, 50);
                }
              }
              resolve(message);
            });
          } else {
            reject(new Error('User denied permission'));
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  async tryTillReceiptAvailable(txhash) {
    try {
      const receipt = await this.blockchain.getTransactionReceipt(txhash);
      if (receipt) return receipt;
    } catch (e) {
      // do nothing
    }
    await this.pause();
    return await this.tryTillReceiptAvailable(txhash);
  }

  async pause() {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, 500);
    });
  }

  async resolve(contractAddress, codeAtAddress, targetPath) {
    const resolved = await this.compilersArtefacts.get(contractAddress);
    if (resolved) return resolved;
  }
}
