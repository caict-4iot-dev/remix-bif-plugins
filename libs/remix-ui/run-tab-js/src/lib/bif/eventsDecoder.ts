'use strict';
import { ethers } from 'ethers';
import fromExponential from 'from-exponential';
import { toBuffer, addHexPrefix } from '@ethereumjs/util';
import { execution } from '@remix-project/remix-lib';

const {
  txHelper: { visitContracts, makeFullTypeDefinition },
} = execution;

function parseFunctionParams (params) {
  const args = []
  // Check if parameter string starts with array or string
  let startIndex = isArrayOrStringStart(params, 0) ? -1 : 0
  for (let i = 0; i < params.length; i++) {
    // If a quote is received
    if (params.charAt(i) === '"') {
      startIndex = -1
      let endQuoteIndex = false
      // look for closing quote. On success, push the complete string in arguments list
      for (let j = i + 1; !endQuoteIndex; j++) {
        if (params.charAt(j) === '"') {
          args.push(normalizeParam(params.substring(i + 1, j)))
          endQuoteIndex = true
          i = j
        }
        // Throw error if end of params string is arrived but couldn't get end quote
        if (!endQuoteIndex && j === params.length - 1) {
          throw new Error('invalid params')
        }
      }
    } else if (params.charAt(i) === '[') { // If an array/struct opening bracket is received
      startIndex = -1
      let bracketCount = 1
      let j
      for (j = i + 1; bracketCount !== 0; j++) {
        // Increase count if another array opening bracket is received (To handle nested array)
        if (params.charAt(j) === '[') {
          bracketCount++
        } else if (params.charAt(j) === ']') { // // Decrease count if an array closing bracket is received (To handle nested array)
          bracketCount--
        }
        // Throw error if end of params string is arrived but couldn't get end of tuple
        if (bracketCount !== 0 && j === params.length - 1) {
          throw new Error('invalid tuple params')
        }
        if (bracketCount === 0) break
      }
      args.push(parseFunctionParams(params.substring(i + 1, j)))
      i = j - 1
    } else if (params.charAt(i) === ',' || i === params.length - 1) { // , or end of string
      // if startIndex >= 0, it means a parameter was being parsed, it can be first or other parameter
      if (startIndex >= 0) {
        let param = params.substring(startIndex, i === params.length - 1 ? undefined : i)
        param = normalizeParam(param)
        args.push(param)
      }
      // Register start index of a parameter to parse
      startIndex = isArrayOrStringStart(params, i + 1) ? -1 : i + 1
    }
  }
  return args
}

const normalizeParam = (param) => {
  param = param.trim()
  if (param.startsWith('0x')) param = `${param}`
  if (/[0-9]/g.test(param)) param = `${param}`

  // fromExponential
  if (!param.startsWith('0x')) {
    const regSci = REGEX_SCIENTIFIC.exec(param)
    const exponents = regSci ? regSci[2] : null
    if (regSci && REGEX_DECIMAL.exec(exponents)) {
      try {
        let paramTrimmed = param.replace(/^'/g, '').replace(/'$/g, '')
        paramTrimmed = paramTrimmed.replace(/^"/g, '').replace(/"$/g, '')
        param = fromExponential(paramTrimmed)     
      } catch (e) {
        console.log(e)
      }
    }
  }  

  if (typeof param === 'string') {          
    if (param === 'true') param = true
    if (param === 'false') param = false
    // if (!isNaN(parseFloat(param)) && isFinite(param)) param = Number(param)        
  }
  return param
}

const REGEX_SCIENTIFIC = /^-?(\d+\.?\d*)e\d*(\d+)$/

const REGEX_DECIMAL = /^\d*/

function isArrayOrStringStart (str, index) {
  return str.charAt(index) === '"' || str.charAt(index) === '['
}

/**
 * Register to txListener and extract events
 *
 */
export class EventsDecoder {
  /**
   * use Transaction Receipt to decode logs. assume that the transaction as already been resolved by txListener.
   * logs are decoded only if the contract if known by remix.
   *
   * @param {Object} tx - transaction object
   * @param {Function} cb - callback
   */
  parseLogs(tx, receipt, contractName, compiledContracts, cb) {
    if (tx.isCall) return cb(null, { decoded: [], raw: [] });
    this._decodeLogs(tx, receipt, contractName, compiledContracts, cb);
  }

  _decodeLogs(tx, receipt, contract, contracts, cb) {
    if (!contract || !receipt) {
      return cb('cannot decode logs - contract or receipt not resolved ');
    }
    if (!receipt.logs) {
      return cb(null, { decoded: [], raw: [] });
    }
    this._decodeEvents(tx, receipt.logs, contract, contracts, cb);
  }

  _eventABI(contract): Record<string, { event; inputs; object; abi }> {
    const eventABI: Record<string, { event; inputs; object; abi }> = {};
    const abi = new ethers.utils.Interface(contract.abi);
    for (const e in abi.events) {
      const event = abi.getEvent(e);
      eventABI[abi.getEventTopic(e).replace('0x', '')] = { event: event.name, inputs: event.inputs, object: event, abi: abi };
    }
    return eventABI;
  }

  _eventsABI(compiledContracts): Record<string, unknown> {
    const eventsABI: Record<string, unknown> = {};
    visitContracts(compiledContracts, (contract) => {
      eventsABI[contract.name] = this._eventABI(contract.object);
    });
    return eventsABI;
  }

  _event(hash, eventsABI) {
    // get all the events responding to that hash.
    const contracts = [];
    for (const k in eventsABI) {
      if (eventsABI[k][hash]) {
        const event = eventsABI[k][hash];
        contracts.push(event);
      }
    }
    return contracts;
  }

  _stringifyBigNumber(value): string {
    return value._isBigNumber ? value.toString() : value;
  }

  _stringifyEvent(value) {
    if (value === null || value === undefined) return ' - ';
    if (value._ethersType) value.type = value._ethersType;
    if (Array.isArray(value)) {
      // for struct && array
      return value.map((item) => {
        return this._stringifyEvent(item);
      });
    } else {
      return this._stringifyBigNumber(value);
    }
  }

  _decodeEvents(tx, logs, contractName, compiledContracts, cb) {
    const eventsABI = this._eventsABI(compiledContracts);
    const events = [];
    for (const i in logs) {
      // [address, topics, mem]
      const log = logs[i];
      const topicId = log.topics[0];
      const eventAbis = this._event(topicId.replace('0x', ''), eventsABI);
      for (const eventAbi of eventAbis) {
        try {
          if (eventAbi) {
            const decodedlog = eventAbi.abi.parseLog(log);
            const decoded = {};
            for (const v in decodedlog.args) {
              decoded[v] = this._stringifyEvent(decodedlog.args[v]);
            }
            events.push({ from: log.address, topic: topicId, event: eventAbi.event, args: decoded });
          } else {
            events.push({ from: log.address, data: log.data, topics: log.topics });
          }
          break; // if one of the iteration is successful
        } catch (e) {
          continue;
        }
      }
    }
    cb(null, { decoded: events, raw: logs });
  }

  _decodeInputParams(data, abi) {
    data = toBuffer(addHexPrefix(data));
    if (!data.length) data = new Uint8Array(32 * abi.inputs.length); // ensuring the data is at least filled by 0 cause `AbiCoder` throws if there's not engouh data

    const inputTypes = [];
    for (let i = 0; i < abi.inputs.length; i++) {
      const type = abi.inputs[i].type;
      inputTypes.push(type.indexOf('tuple') === 0 ? makeFullTypeDefinition(abi.inputs[i]) : type);
    }
    const abiCoder = new ethers.utils.AbiCoder();
    const decoded = abiCoder.decode(inputTypes, data);
    const ret = {};
    for (const k in abi.inputs) {
      ret[abi.inputs[k].type + ' ' + abi.inputs[k].name] = decoded[k];
    }
    return ret;
  }

  _parseInputParams(decoded, abi) {
    const ret = {};
    for (const k in abi.inputs) {
      ret[abi.inputs[k].type + ' ' + abi.inputs[k].name] = decoded[k];
    }
    return ret;
  }

  _parseFunctionParams(params) {
    return parseFunctionParams(params)
  }
}
