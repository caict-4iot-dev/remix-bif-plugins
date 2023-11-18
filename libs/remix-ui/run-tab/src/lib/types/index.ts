import { Ref } from 'react'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import { ContractData, FuncABI, OverSizeLimit } from '@remix-project/core-plugin'
import { RunTab } from './run-tab'
import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core'
import { LayoutCompatibilityReport } from '@openzeppelin/upgrades-core/dist/storage/report'
export interface RunTabProps {
  plugin: RunTab
}

export interface Contract {
  name: string,
  alias: string,
  file: string,
  compiler: CompilerAbstract,
  compilerName: string
}

export interface ContractList {
  [file: string]: Contract[]
}
export interface RunTabState {
  accounts: {
    loadedAccounts: Record<string, string>,
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string,
    selectedAccount: string
  },
  sendValue: string,
  sendUnit: 'ether' | 'finney' | 'gwei' | 'wei' | 'uxht' | 'xht';
  gasLimit: number,
  selectExEnv: string,
  personalMode: boolean,
  networkName: string,
  providers: {
    providerList: {
      id?: string,
      dataId?: string,
      title?: string,
      value: string,
      fork?: string
      content: string
    }[],
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  notification: {
    title: string,
    message: string,
    actionOk: () => void,
    actionCancel: (() => void) | null,
    labelOk: string,
    labelCancel: string
  },
  externalEndpoint: string,
  popup: string,
  passphrase: string,
  matchPassphrase: string,
  contracts: {
    contractList: {
      [file: string]: {
        name: string,
        alias: string,
        file: string,
        compiler: CompilerAbstract
        compilerName: string
      }[]
    },
    deployOptions: { [file: string]: { [name: string]: DeployOptions } },
    loadType: 'abi' | 'sol' | 'other'
    currentFile: string,
    compilationSource: string,
    currentContract: string,
    compilationCount: number,
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  ipfsChecked: boolean,
  gasPriceStatus: boolean,
  confirmSettings: boolean,
  maxFee: string,
  maxPriorityFee: string,
  baseFeePerGas: string,
  gasPrice: string,
  instances: {
    instanceList: {
      contractData?: ContractData,
      address: string,
      balance?: number,
      name: string,
      decodedResponse?: Record<number, any>,
      abi?: any
    }[],
    error: string
  },
  recorder: {
    pathToScenario: string,
    transactionCount: number
  }
  remixdActivated: boolean,
  proxy: {
    deployments: { address: string, date: string, contractName: string }[]
  }
  bif: any;
}

export interface SettingsProps {
  selectExEnv: string,
  accounts: {
    loadedAccounts: Record<string, any>,
    selectedAccount: string,
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  setAccount: (account: string) => void,
  setUnit: (unit: 'ether' | 'finney' | 'gwei' | 'wei') => void,
  sendValue: string,
  sendUnit: string,
  gasLimit: number,
  setGasFee: (value: number) => void,
  personalMode: boolean,
  networkName: string,
  providers: {
    providerList: {
      id?: string,
      dataId?: string,
      title?: string,
      value: string,
      fork?: string
      content: string
    }[],
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  setExecutionContext: (executionContext: { context: string, fork: string }) => void,
  createNewBlockchainAccount: (cbMessage: JSX.Element) => void,
  setPassphrase: (passphrase: string) => void,
  setMatchPassphrase: (passphrase: string) => void,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void, okBtnClass?: string, cancelBtnClass?: string) => void,
  tooltip: (toasterMsg: string) => void,
  signMessageWithAddress: (account: string, message: string, modalContent: (hash: string, data: string) => JSX.Element, passphrase?: string) => void,
  passphrase: string,
  setSendValue: (value: string) => void
}

export interface EnvironmentProps {
  selectedEnv: string,
  providers: {
    providerList: {
      id?: string,
      dataId?: string,
      title?: string,
      value: string,
      fork?: string
      content: string
    }[],
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  setExecutionContext: (executionContext: { context: string }) => void
}

export interface NetworkProps {
  networkName: string
}

export interface AccountProps {
  selectExEnv: string,
  accounts: {
    loadedAccounts: Record<string, any>,
    selectedAccount: string,
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  setAccount: (account: string) => void,
  personalMode: boolean,
  createNewBlockchainAccount: (cbMessage: JSX.Element) => void,
  setPassphrase: (passphrase: string) => void,
  setMatchPassphrase: (passphrase: string) => void,
  tooltip: (toasterMsg: string) => void,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void, okBtnClass?: string, cancelBtnClass?: string) => void,
  signMessageWithAddress: (account: string, message: string, modalContent: (hash: string, data: string) => JSX.Element, passphrase?: string) => void,
  passphrase: string
}

export interface GasPriceProps {
  gasLimit: number,
  setGasFee: (value: number) => void
}

export interface ValueProps {
  setUnit: (unit: 'ether' | 'finney' | 'gwei' | 'wei') => void,
  setSendValue: (value: string) => void,
  sendValue: string,
  sendUnit: string
}

export interface Tx {
  from: string,
  to: string,
  data: string,
  gas: string
}

export interface Network {
  name: string,
  lastBlock: {
    baseFeePerGas: string
  }
}

export type MainnetPrompt = (
  tx: Tx, network:
  Network, amount: string,
  gasEstimation: string,
  gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void,
  determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void
  ) => JSX.Element

export interface ContractDropdownProps {
  selectedAccount: string,
  exEnvironment: string,
  contracts: {
    contractList: ContractList,
    deployOptions: { [file: string]: { [name: string]: DeployOptions } },
    loadType: 'abi' | 'sol' | 'other',
    currentFile: string,
    compilationSource: string
    currentContract: string,
    compilationCount: number,
    isRequesting: boolean,
    isSuccessful: boolean,
    error: string
  },
  syncContracts: () => void,
  getSelectedContract: (contractName: string, compiler: CompilerAbstract) => ContractData,
  modal: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void, okBtnClass?: string, cancelBtnClass?: string) => void,
  passphrase: string,
  setPassphrase: (passphrase: string) => void,
  createInstance: (
    selectedContract: ContractData,
    gasEstimationPrompt: (msg: string) => JSX.Element,
    passphrasePrompt: (msg: string) => JSX.Element,
    publishToStorage: (storage: 'ipfs' | 'swarm',
    contract: ContractData) => void,
    mainnetPrompt: MainnetPrompt,
    isOverSizePrompt: (values: OverSizeLimit) => JSX.Element,
    args,
    deployMode: DeployMode[]) => void,
  ipfsCheckedState: boolean,
  setIpfsCheckedState: (value: boolean) => void,
  publishToStorage: (storage: 'ipfs' | 'swarm', contract: ContractData) => void,
  gasEstimationPrompt: (msg: string) => JSX.Element,
  passphrasePrompt: (message: string) => JSX.Element,
  mainnetPrompt: (tx: Tx, network: Network, amount: string, gasEstimation: string, gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void, determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void) => JSX.Element,
  tooltip: (toasterMsg: string | JSX.Element) => void,
  loadAddress: (contract: ContractData, address: string) => void,
  networkName: string,
  setNetworkName: (name: string) => void,
  setSelectedContract: (contractName: string) => void
  remixdActivated: boolean,
  isValidProxyAddress?: (address: string) => Promise<boolean>,
  isValidProxyUpgrade?: (proxyAddress: string, contractName: string, solcInput: SolcInput, solcOuput: SolcOutput, solcVersion: string) => Promise<LayoutCompatibilityReport | { ok: boolean, pass: boolean, warning: boolean }>,
  proxy: { deployments: { address: string, date: string, contractName: string }[] }
}

export interface RecorderProps {
  storeScenario: (prompt: (msg: string, defaultValue: string) => JSX.Element) => void,
  runCurrentScenario: (liveMode: boolean, gasEstimationPrompt: (msg: string) => JSX.Element, passphrasePrompt: (msg: string) => JSX.Element, confirmDialogContent: MainnetPrompt) => void,
  mainnetPrompt: MainnetPrompt,
  gasEstimationPrompt: (msg: string) => JSX.Element,
  passphrasePrompt: (msg: string) => JSX.Element,
  scenarioPrompt: (msg: string, defaultValue: string) => JSX.Element,
  count: number
  currentFile: string
}

export interface InstanceContainerProps {
  instances: {
    instanceList: {
      contractData?: ContractData,
      address: string,
      balance?: number,
      name: string,
      decodedResponse?: Record<number, any>,
      abi?: any
    }[],
    error: string
  },
  clearInstances: () => void,
  removeInstance: (index: number) => void,
  getContext: () => 'memory' | 'blockchain',
  runTransactions: (
    instanceIndex: number,
    lookupOnly: boolean,
    funcABI: FuncABI,
    inputsValues: string,
    contractName: string,
    contractABI, contract,
    address,
    logMsg:string,
    mainnetPrompt: MainnetPrompt,
    gasEstimationPrompt: (msg: string) => JSX.Element,
    passphrasePrompt: (msg: string) => JSX.Element,
    funcIndex?: number) => void,
  gasEstimationPrompt: (msg: string) => JSX.Element,
  passphrasePrompt: (message: string) => JSX.Element,
  mainnetPrompt: (tx: Tx, network: Network, amount: string, gasEstimation: string, gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void, determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void) => JSX.Element,
  sendValue: string,
  getFuncABIInputs: (funcABI: FuncABI) => string
}

export interface Modal {
  hide?: boolean
  title: string
  // eslint-disable-next-line no-undef
  message: string | JSX.Element
  okLabel: string
  okFn: () => void
  cancelLabel: string
  cancelFn: () => void,
  okBtnClass?: string,
  cancelBtnClass?: string
}

export type DeployMode = 'Deploy with Proxy' | 'Upgrade with Proxy'

export type DeployOption = {
  initializeInputs: string,
  inputs: {
    inputs: {
      internalType?: string,
      name: string,
      type: string
    }[],
    name: "initialize",
    outputs?: any[],
    stateMutability: string,
    type: string,
    payable?: boolean,
    constant?: any
  }
}
export interface DeployOptions {
  initializeOptions: DeployOption,
  options: { title: DeployMode, active: boolean }[]
}

export interface ContractGUIProps {
  title?: string,
  funcABI: FuncABI,
  inputs: string,
  clickCallBack: (inputs: { name: string, type: string }[], input: string, deployMode?: DeployMode[]) => void,
  widthClass?: string,
  evmBC: any,
  lookupOnly: boolean,
  disabled?: boolean,
  isDeploy?: boolean,
  deployOption?: { title: DeployMode, active: boolean }[],
  initializerOptions?: DeployOption,
  proxy?: { deployments: { address: string, date: string, contractName: string }[] },
  isValidProxyAddress?: (address: string) => Promise<boolean>,
  isValidProxyUpgrade?: (proxyAddress: string) => Promise<LayoutCompatibilityReport | { ok: boolean, pass: boolean, warning: boolean }>,
  modal?: (title: string, message: string | JSX.Element, okLabel: string, okFn: () => void, cancelLabel?: string, cancelFn?: () => void, okBtnClass?: string, cancelBtnClass?: string) => void
}
export interface MainnetProps {
  network: Network,
  tx: Tx,
  amount: string,
  gasEstimation: string,
  setNewGasPrice: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void,
  updateGasPriceStatus: (status: boolean) => void,
  updateConfirmSettings: (confirmation: boolean) => void,
  updateMaxFee: (fee: string) => void,
  updateBaseFeePerGas: (fee: string) => void,
  init: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void,
  updateGasPrice: (price: string) => void,
  updateMaxPriorityFee: (fee: string) => void
  maxFee: string,
  maxPriorityFee: string
}

export interface UdappProps {
  instance: {
    contractData?: ContractData,
    address: string,
    balance?: number,
    name: string,
    decodedResponse?: Record<number, any>,
    abi?: any
  },
  context: 'memory' | 'blockchain',
  removeInstance: (index: number) => void,
  index: number,
  gasEstimationPrompt: (msg: string) => JSX.Element,
  passphrasePrompt: (message: string) => JSX.Element,
  mainnetPrompt: (tx: Tx, network: Network, amount: string, gasEstimation: string, gasFees: (maxFee: string, cb: (txFeeText: string, priceStatus: boolean) => void) => void, determineGasPrice: (cb: (txFeeText: string, gasPriceValue: string, gasPriceStatus: boolean) => void) => void) => JSX.Element,
  runTransactions: (
    instanceIndex: number,
    lookupOnly: boolean,
    funcABI: FuncABI,
    inputsValues: string,
    contractName: string,
    contractABI, contract,
    address,
    logMsg:string,
    mainnetPrompt: MainnetPrompt,
    gasEstimationPrompt: (msg: string) => JSX.Element,
    passphrasePrompt: (msg: string) => JSX.Element,
    funcIndex?: number) => void,
  sendValue: string,
  getFuncABIInputs: (funcABI: FuncABI) => string
}

export interface DeployButtonProps {
  deployOptions: { title: DeployMode, active: boolean }[],
  buttonOptions: {
    title: string,
    content: string,
    classList: string,
    dataId: string,
    widthClass: string
  },
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  handleActionClick: () => void
}

export interface DeployInputProps {
  funcABI: FuncABI,
  inputs: string,
  handleBasicInput: (e) => void,
  basicInputRef: Ref<HTMLInputElement>,
  buttonOptions: {
    title: string,
    content: string,
    classList: string,
    dataId: string,
    widthClass: string
  },
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  handleActionClick: (fields?: HTMLInputElement[]) => void,
  deployOptions: { title: DeployMode, active: boolean }[]
}

export interface MultiDeployInputProps {
  deployOptions?: { title: DeployMode, active: boolean }[],
  buttonOptions: {
    title: string,
    content: string,
    classList: string,
    dataId: string,
    widthClass: string
  },
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  handleMultiValsSubmit: (fields?: HTMLInputElement[]) => void,
  inputs: {
    internalType?: string,
    name: string,
    type: string
  }[],
  getMultiValsString: (fields: HTMLInputElement[]) => void
}
