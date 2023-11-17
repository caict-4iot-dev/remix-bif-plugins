import {Bee} from '@ethersphere/bee-js'
// eslint-disable-next-line no-unused-vars
import type {UploadResult} from '@ethersphere/bee-js'

// public gateway node address
const publicBeeNode = new Bee('https://api.gateway.ethswarm.org/')

// on the public gateway the postage stamp id is not relevant, so we use all zeroes
const defaultPostageStampId = '0000000000000000000000000000000000000000000000000000000000000000'

export const publishToSwarm = async (contract, api) => {
  // gather list of files to publish
  const sources = []
  let metadata
  const item = {content: null, hash: null}
  const uploaded = []

  try {
    metadata = JSON.parse(contract.metadata)
  } catch (e) {
    throw new Error(e)
  }

  if (metadata === undefined) {
    throw new Error('No metadata')
  }

  await Promise.all(
    Object.keys(metadata.sources).map((fileName) => {
      return new Promise((resolve, reject) => {
        // find hash
        let hash = null
        try {
          // we try extract the hash defined in the metadata.json
          // in order to check if the hash that we get after publishing is the same as the one located in metadata.json
          // if it's not the same, we throw "hash mismatch between solidity bytecode and uploaded content"
          // if we don't find the hash in the metadata.json, the check is not done.
          //
          // TODO: refactor this with publishOnIpfs
          if (metadata.sources[fileName].urls) {
            metadata.sources[fileName].urls.forEach((url) => {
              if (url.includes('bzz')) hash = url.match('bzz-raw://(.+)')[1]
            })
          }
        } catch (e) {
          return reject(new Error('Error while extracting the hash from metadata.json'))
        }

        api
          .readFile(fileName)
          .then((content) => {
            sources.push({
              content: content,
              hash: hash,
              filename: fileName
            })
            resolve({
              content: content,
              hash: hash,
              filename: fileName
            })
          })
          .catch((error) => {
            console.log(error)
            reject(error)
          })
      })
    })
  )

  // the list of nodes to publish to
  const beeNodes = [publicBeeNode]

  // add custom private Bee node to the list
  const postageStampId = api.config.get('settings/swarm-postage-stamp-id') || defaultPostageStampId
  const privateBeeAddress = api.config.get('settings/swarm-private-bee-address')
  if (privateBeeAddress) {
    const privateBee = new Bee(privateBeeAddress)
    beeNodes.push(privateBee)
  }

  // publish the list of sources in order, fail if any failed
  await Promise.all(
    sources.map(async (item) => {
      try {
        const result = await swarmVerifiedPublish(beeNodes, postageStampId, item.content, item.hash, api)

        try {
          item.hash = result.url.match('bzz-raw://(.+)')[1]
        } catch (e) {
          item.hash = '<Metadata inconsistency> - ' + item.fileName
        }
        item.output = result
        uploaded.push(item)
        // TODO this is a fix cause Solidity metadata does not contain the right swarm hash (poc 0.3)
        metadata.sources[item.filename].urls[0] = result.url
      } catch (error) {
        console.error(error)
        throw new Error(error)
      }
    })
  )

  const metadataContent = JSON.stringify(metadata, null, '\t')
  try {
    const result = await swarmVerifiedPublish(beeNodes, postageStampId, metadataContent, '', api)

    try {
      contract.metadataHash = result.url.match('bzz-raw://(.+)')[1]
    } catch (e) {
      contract.metadataHash = '<Metadata inconsistency> - metadata.json'
    }
    item.content = metadataContent
    item.hash = contract.metadataHash
    uploaded.push({
      content: contract.metadata,
      hash: contract.metadataHash,
      filename: 'metadata.json',
      output: result
    })
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }

  return {uploaded, item}
}

const swarmVerifiedPublish = async (beeNodes: Bee[], postageStampId: string, content, expectedHash, api): Promise<Record<string, any>> => {
  try {
    const results = await uploadToBeeNodes(beeNodes, postageStampId, content)
    const hash = hashFromResults(results)

    if (expectedHash && hash !== expectedHash) {
      return {
        message: 'hash mismatch between solidity bytecode and uploaded content.',
        url: 'bzz-raw://' + hash,
        hash
      }
    } else {
      api.writeFile('swarm/' + hash, content)
      return {message: 'ok', url: 'bzz-raw://' + hash, hash}
    }
  } catch (error) {
    throw new Error(error)
  }
}

const hashFromResults = (results: UploadResult[]) => {
  for (const result of results) {
    if (result != null) {
      return result.reference
    }
  }
  throw new Error('no result')
}

const uploadToBee = async (bee: Bee, postageStampId: string, content) => {
  try {
    if (bee.url === publicBeeNode.url) {
      postageStampId = defaultPostageStampId
    }
    return await bee.uploadData(postageStampId, content)
  } catch {
    // ignore errors for now
    return null
  }
}

const uploadToBeeNodes = (beeNodes: Bee[], postageBatchId: string, content) => {
  return Promise.all(beeNodes.map((node) => uploadToBee(node, postageBatchId, content)))
}
