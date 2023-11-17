'use strict'
import Web3, { Web3PluginBase } from 'web3'

export function extendWeb3 (web3) {
  if(!web3.debug){
    web3.registerPlugin(new Web3DebugPlugin())
  }
}

export function loadWeb3 (url) {
  if (!url) url = 'http://localhost:8545'
  const web3 = new Web3()
  web3.setProvider(new Web3.providers.HttpProvider(url))
  extendWeb3(web3)
  return web3
}

export function setProvider (web3, url) {
  web3.setProvider(new web3.providers.HttpProvider(url))
}

export function web3DebugNode (network) {
  const web3DebugNodes = {
    Main: 'https://eth.getblock.io/68069907-1d3c-466e-a533-a943afd935c6/mainnet',
    Rinkeby: 'https://remix-rinkeby.ethdevops.io',
    Ropsten: 'https://remix-ropsten.ethdevops.io',
    Goerli: 'https://remix-goerli.ethdevops.io',
    Sepolia: 'https://remix-sepolia.ethdevops.io'
  }
  if (web3DebugNodes[network]) {
    return loadWeb3(web3DebugNodes[network])
  }
  return null
}

class Web3DebugPlugin extends Web3PluginBase {
  public pluginNamespace = 'debug'

  public preimage(key, cb) {
    this.requestManager.send({
      method: 'debug_preimage',
      params: [key]
    })
      .then(result => cb(null, result))
      .catch(error => cb(error))
  }

  public traceTransaction(txHash, options, cb) {
    this.requestManager.send({
      method: 'debug_traceTransaction',
      params: [txHash, options]
    })
      .then(result => cb(null, result))
      .catch(error => cb(error))
  }

  public storageRangeAt(txBlockHash, txIndex, address, start, maxSize, cb) {
    this.requestManager.send({
      method: 'debug_storageRangeAt',
      params: [txBlockHash, txIndex, address, start, maxSize]
    })
      .then(result => cb(null, result))
      .catch(error => cb(error))
  }
}
