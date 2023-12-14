import { ICompilerApi } from '@remix-project/remix-lib'
import { getValidLanguage, Compiler} from '@remix-project/remix-solidity'
import { EventEmitter } from 'events'
import bs58 from 'bs58';

declare global {
  interface Window {
    _paq: any
  }
}
const _paq = window._paq = window._paq || []  //eslint-disable-line

function fromBidAddress(address) {
  const bytes = bs58.decode(address.substring(10))
  const hex = Buffer.from(bytes).toString('hex')
  address = '6566' + hex
  return address;
}

function bidAddressReplace(context) {
  let posStart = 0;
  let posEnd = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    posStart = context.indexOf("did:bid", posEnd);
    if (posStart !== -1) {
      posEnd = 0;
      posEnd = context.indexOf(";", posStart);
      const oldbidAddress = context.substring(posStart, posEnd);
      console.log("oldbidAddress:" + oldbidAddress);
      const newbidAddress = fromBidAddress(oldbidAddress);
      console.log("newbidAddress:" + newbidAddress);
      context = context.replace(oldbidAddress, "0x" + newbidAddress);
    } else {
      break;
    }
  }
  return context;
}

export class CompileTabLogic {
  public compiler
  public api
  public contentImport
  public optimize
  public runs
  public evmVersion: string
  public language: string
  public compilerImport
  public event
  public evmVersions: Array<string>
  public useFileConfiguration: boolean
  public configFilePath: string

  constructor (api: ICompilerApi, contentImport) {
    this.api = api
    this.contentImport = contentImport
    this.event = new EventEmitter()
    this.compiler = new Compiler((url, cb) => api.resolveContentAndSave(url).then((result) => cb(null, result)).catch((error) => cb(error.message)))
    this.evmVersions = ['default']
    // this.evmVersions = ['default', 'shanghai', 'paris', 'london', 'berlin', 'istanbul', 'petersburg', 'constantinople', 'byzantium', 'spuriousDragon', 'tangerineWhistle', 'homestead']
  }

  init () {
    this.optimize = this.api.getCompilerParameters().optimize
    this.api.setCompilerParameters({ optimize: this.optimize })
    this.compiler.set('optimize', this.optimize)

    this.runs = this.api.getCompilerParameters().runs
    this.runs = this.runs && this.runs !== 'undefined' ? this.runs : 200
    this.api.setCompilerParameters({ runs: this.runs })
    this.compiler.set('runs', this.runs)

    this.evmVersion = this.api.getCompilerParameters().evmVersion
    if (
      this.evmVersion === 'undefined' || 
      this.evmVersion === 'null' || 
      !this.evmVersion || 
      !this.evmVersions.includes(this.evmVersion)) {
      this.evmVersion = null
    }
    this.api.setCompilerParameters({ evmVersion: this.evmVersion })
    this.compiler.set('evmVersion', this.evmVersion)

    this.language = getValidLanguage(this.api.getCompilerParameters().language)
    if (this.language != null) {
      this.compiler.set('language', this.language)
    }
  }

  setOptimize (newOptimizeValue: boolean) {
    this.optimize = newOptimizeValue
    this.api.setCompilerParameters({ optimize: this.optimize })
    this.compiler.set('optimize', this.optimize)
  }

  setUseFileConfiguration (useFileConfiguration: boolean) {
    this.useFileConfiguration = useFileConfiguration
    this.compiler.set('useFileConfiguration', useFileConfiguration)
  }

  setConfigFilePath (path) {
    this.configFilePath = path
  }

  setRuns (runs) {
    this.runs = runs
    this.api.setCompilerParameters({ runs: this.runs })
    this.compiler.set('runs', this.runs)
  }

  setEvmVersion (newEvmVersion) {
    this.evmVersion = newEvmVersion
    this.api.setCompilerParameters({ evmVersion: this.evmVersion })
    this.compiler.set('evmVersion', this.evmVersion)
  }

  getCompilerState () {
    return this.compiler.state
  }

  /**
   * Set the compiler to using Solidity or Yul (default to Solidity)
   * @params lang {'Solidity' | 'Yul'} ...
   */
  setLanguage (lang) {
    this.language = lang
    this.api.setCompilerParameters({ language: lang })
    this.compiler.set('language', lang)
  }

  /**
   * Compile a specific file of the file manager
   * @param {string} target the path to the file to compile
   */
  compileFile (target) {
    if (!target) throw new Error('No target provided for compiliation')
    return new Promise((resolve, reject) => {
      this.api.readFile(target).then(async(content) => {
        const sources = { [target]: { content: bidAddressReplace(content) } }
        this.event.emit('removeAnnotations')
        this.event.emit('startingCompilation')
        if(await this.api.fileExists('remappings.txt')) {
          this.api.readFile('remappings.txt').then( remappings => {
            this.compiler.set('remappings', remappings.split('\n'))
          })
        }
        if (this.configFilePath) {
          this.api.readFile(this.configFilePath).then( contentConfig => {
            this.compiler.set('configFileContent', contentConfig)
          })
        }
        // setTimeout fix the animation on chrome... (animation triggered by 'staringCompilation')
        setTimeout(() => { this.compiler.compile(sources, target); resolve(true) }, 100)
      }).catch((error) => {
        reject(error)
      })
    })
  }

  async isHardhatProject () {
    if (this.api.getFileManagerMode() === 'localhost') {
      return await this.api.fileExists('hardhat.config.js') || await this.api.fileExists('hardhat.config.ts')
    } else return false
  }

  async isTruffleProject () {
    if (this.api.getFileManagerMode() === 'localhost') {
      return await this.api.fileExists('truffle-config.js')
    } else return false
  }

  async isFoundryProject () {
    if (this.api.getFileManagerMode() === 'localhost') {
      return await this.api.fileExists('foundry.toml')
    } else return false
  }

  runCompiler (externalCompType) {
    try {
      if (this.api.getFileManagerMode() === 'localhost') {
        if (externalCompType === 'hardhat') {
          const { currentVersion, optimize, runs } = this.compiler.state
          if (currentVersion) {
            const fileContent = `module.exports = {
              solidity: '${currentVersion.substring(0, currentVersion.indexOf('+commit'))}',
              settings: {
                optimizer: {
                  enabled: ${optimize},
                  runs: ${runs}
                }
              }
            }
            `
            const configFilePath = 'remix-compiler.config.js'
            this.api.writeFile(configFilePath, fileContent)
            _paq.push(['trackEvent', 'compiler', 'runCompile', 'compileWithHardhat'])
            this.api.compileWithHardhat(configFilePath).then((result) => {
              this.api.logToTerminal({ type: 'log', value: result })
            }).catch((error) => {
              this.api.logToTerminal({ type: 'error', value: error })
            })
          }
        } else if (externalCompType === 'truffle') {
          const { currentVersion, optimize, runs, evmVersion } = this.compiler.state
          if (currentVersion) {
            const fileContent = `module.exports = {
              compilers: {
                solc: {
                  version: '${currentVersion.substring(0, currentVersion.indexOf('+commit'))}',
                  settings: {
                    optimizer: {
                      enabled: ${optimize},
                      runs: ${runs},
                    },
                    evmVersion: ${evmVersion}
                  }
                }
              }
            }`
            const configFilePath = 'remix-compiler.config.js'
            this.api.writeFile(configFilePath, fileContent)
            _paq.push(['trackEvent', 'compiler', 'runCompile', 'compileWithTruffle'])
            this.api.compileWithTruffle(configFilePath).then((result) => {
              this.api.logToTerminal({ type: 'log', value: result })
            }).catch((error) => {
              this.api.logToTerminal({ type: 'error', value: error })
            })
          }
        }
      }
      // TODO readd saving current file
      this.api.saveCurrentFile()
      const currentFile = this.api.currentFile
      return this.compileFile(currentFile)
    } catch (err) {
      console.error(err)
    }
  }
}
