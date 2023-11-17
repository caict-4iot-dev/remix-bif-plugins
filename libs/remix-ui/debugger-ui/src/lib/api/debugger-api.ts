import Web3 from 'web3'
import { init , traceHelper, TransactionDebugger as Debugger } from '@remix-project/remix-debug'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import { lineText } from '@remix-ui/editor'
import { util } from '@remix-project/remix-lib'
const { toHexPaddedString } = util

export const DebuggerApiMixin = (Base) => class extends Base {

  initialWeb3
  debuggerBackend

  initDebuggerApi () {
    const self = this
    this.web3Provider = {
      sendAsync (payload, callback) {
        return self.call('web3Provider', 'sendAsync', payload)
      }
    }
    this._web3 = new Web3(this.web3Provider)
    // this._web3 can be overwritten and reset to initial value in 'debug' method
    this.initialWeb3 = this._web3
    init.extendWeb3(this._web3)

    this.offsetToLineColumnConverter = {
      async offsetToLineColumn (rawLocation, file, sources, asts) {
        return await self.call('offsetToLineColumnConverter', 'offsetToLineColumn', rawLocation, file, sources, asts)
      }
    }
  }

  // on()
  // call()
  // onDebugRequested()
  // onRemoveHighlights()

  web3 () {
    return this._web3
  }

  async discardHighlight () {
    await this.call('editor', 'discardHighlight')
    await this.call('editor', 'discardLineTexts' as any)
  }

  async highlight (lineColumnPos, path, rawLocation, stepDetail, lineGasCost) {
    await this.call('editor', 'highlight', lineColumnPos, path, '', { focus: true })
    const label = `${stepDetail.op} costs ${stepDetail.gasCost} gas - this line costs ${lineGasCost} gas - ${stepDetail.gas} gas left`
    const linetext: lineText = {
      content: label,
      position: lineColumnPos,
      hide: false,
      className: 'text-muted small',
      afterContentClassName: 'text-muted small fas fa-gas-pump pl-4',
      from: 'debugger',
      hoverMessage: [{
        value: label,
      },
      ],
    }
    await this.call('editor', 'addLineText' as any, linetext, path)
  }

  async getFile (path) {
    return await this.call('fileManager', 'getFile', path)
  }

  async setFile (path, content) {
    await this.call('fileManager', 'setFile', path, content)
  }

  onBreakpointCleared (listener) {
    this.onBreakpointClearedListener = listener
  }

  onBreakpointAdded (listener) {
    this.onBreakpointAddedListener = listener
  }

  onEditorContentChanged (listener) {
    this.onEditorContentChangedListener = listener
  }

  onEnvChanged (listener) {
    this.onEnvChangedListener = listener
  }

  onDebugRequested (listener) {
    this.onDebugRequestedListener = listener
  }

  onRemoveHighlights (listener) {
    this.onRemoveHighlightsListener = listener
  }

  async fetchContractAndCompile (address, receipt) {
    const target = (address && traceHelper.isContractCreation(address)) ? receipt.contractAddress : address
    const targetAddress = target || receipt.contractAddress || receipt.to
    const codeAtAddress = await this._web3.eth.getCode(targetAddress)
    const output = await this.call('fetchAndCompile', 'resolve', targetAddress, codeAtAddress, '.debug')
    if (output) {
      return new CompilerAbstract(output.languageversion, output.data, output.source)
    }
    return null
  }

  async getDebugWeb3 () {
    let web3
    let network
    try {
      network = await this.call('network', 'detectNetwork')    
    } catch (e) {
      web3 = this.web3()
    }
    if (!web3) {
      const webDebugNode = init.web3DebugNode(network.name)
      web3 = !webDebugNode ? this.web3() : webDebugNode
    }
    init.extendWeb3(web3)
    return web3
  }

  async getTrace (hash) {
    if (!hash) return
    const web3 = await this.getDebugWeb3()
    const currentReceipt = await web3.eth.getTransactionReceipt(hash)
    const debug = new Debugger({
      web3,
      offsetToLineColumnConverter: this.offsetToLineColumnConverter,
      compilationResult: async (address) => {
        try {
          return await this.fetchContractAndCompile(address, currentReceipt)
        } catch (e) {
          console.error(e)
        }
        return null
      },
      debugWithGeneratedSources: false
    })
    const trace = await debug.debugger.traceManager.getTrace(hash)
    trace.structLogs = trace.structLogs.map((step) => {
      const stack = []
      for (const prop in step.stack) {
        if (prop !== 'length') {
          stack.push(toHexPaddedString(step.stack[prop]))
        }
      }
      step.stack = stack
      return step
    })
    return trace
  }

  debug (hash, web3?) {
    try {
      this.call('fetchAndCompile', 'clearCache')
    } catch (e) {
      console.error(e)
    }
    if (web3) this._web3 = web3
    else this._web3 = this.initialWeb3
    init.extendWeb3(this._web3)
    if (this.onDebugRequestedListener) {
      this.onDebugRequestedListener(hash, this._web3).then((debuggerBackend) => {
        this.debuggerBackend = debuggerBackend
      })
    }
  }

  onActivation () {
    this.on('editor', 'breakpointCleared', (fileName, row) => { if (this.onBreakpointClearedListener) this.onBreakpointClearedListener(fileName, row) })
    this.on('editor', 'breakpointAdded', (fileName, row) => { if (this.onBreakpointAddedListener) this.onBreakpointAddedListener(fileName, row) })
    this.on('editor', 'contentChanged', () => { if (this.onEditorContentChangedListener) this.onEditorContentChangedListener() })  
    this.on('network', 'providerChanged', (provider) => { if (this.onEnvChangedListener) this.onEnvChangedListener(provider) })
  }

  onDeactivation () {
    if (this.onRemoveHighlightsListener) this.onRemoveHighlightsListener()
    this.off('editor', 'breakpointCleared')
    this.off('editor', 'breakpointAdded')
    this.off('editor', 'contentChanged')
  }

  showMessage (title: string, message: string) {}

  onStartDebugging (debuggerBackend: any) {
    this.call('layout', 'maximiseSidePanel')
    this.emit('startDebugging')
    this.debuggerBackend = debuggerBackend
  }

  onStopDebugging () {
    this.call('layout', 'resetSidePanel')
    this.emit('stopDebugging')
    this.debuggerBackend = null
  }
}

