'use strict'
import helper from './helper'
import { CompilationResult, CompilerInput, CompilationSourceCode } from './types'

export class CompilerAbstract {
  languageversion: string
  data: CompilationResult
  source: CompilationSourceCode
  input: CompilerInput
  constructor (languageversion: string, data: CompilationResult, source: CompilationSourceCode, input?: CompilerInput) {
    this.languageversion = languageversion
    this.data = data
    this.source = source // source code
    this.input = input
  }

  getContracts () {
    return this.data.contracts || {}
  }

  getContract (name) {
    return helper.getContract(name, this.data.contracts)
  }

  visitContracts (calllback) {
    return helper.visitContracts(this.data.contracts, calllback)
  }

  getData () {
    return this.data
  }

  getInput () {
    return this.input
  }

  getAsts () {
    return this.data.sources // ast
  }

  getSourceName (fileIndex) {
    if (this.data && this.data.sources) {
      return Object.keys(this.data.sources)[fileIndex]
    } else if (Object.keys(this.source.sources).length === 1) {
      // if we don't have ast, we return the only one filename present.
      const sourcesArray = Object.keys(this.source.sources)
      return sourcesArray[0]
    }
    return null
  }

  getSourceCode () {
    return this.source
  }
}
