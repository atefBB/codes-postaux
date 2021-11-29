/* eslint unicorn/no-process-exit: off */
const fs = require('fs')
const { join } = require('path')
const { promisify } = require('util')
const { chain, pick } = require('lodash')
const { getLatestFIMOCTFileBuffer } = require('./download-fimoct')
const { extractFromFIMOCT } = require('./extract-fimoct')
const { expandWithCommune } = require('./communes')

const writeFile = promisify(fs.writeFile)

function writeAsJSONFile(path, codesPostaux) {
  const data = codesPostaux.map(cp => JSON.stringify(cp)).join(',\n')
  return writeFile(path, '[\n' + data + '\n]')
}

const COMPACT_KEYS = ['zipCode', 'townCode', 'townName', 'routingLabel']

function buildCompact(codesPostaux) {
  return chain(codesPostaux)
    .map(cp => pick(cp, ...COMPACT_KEYS))
    .uniqBy(cp => `${cp.zipCode}-${cp.townCode}`)
    .value()
}

function expandWithDefault(codesPostaux) {
  return chain(codesPostaux)
    .map(entry => ({
      zipCode: entry.codePostal,
      townCode: entry.codeCommune,
      routingLabel: entry.libelleAcheminement,
      code: entry.codeVoie
    }))
    .groupBy('zipCode')
    .map((townsZipCodes, townCode) => {
      if (!townsZipCodes.some(cp => cp.code === 'XXXX')) {
        const zipCode = chain(townsZipCodes)
          .countBy('zipCode')
          .toPairs()
          .maxBy(p => p[1])
          .value()[0]

        const routingLabel = chain(townsZipCodes)
          .countBy('routingLabel')
          .toPairs()
          .maxBy(p => p[1])
          .value()[0]

        townsZipCodes.push({
          townCode,
          zipCode,
          routingLabel,
          code: 'XXXX'
        })
      }

      return townsZipCodes
    })
    .flatten()
    .value()
}

async function main() {
  const buffer = await getLatestFIMOCTFileBuffer()
  const codesPostaux = expandWithDefault(await extractFromFIMOCT(buffer))
  codesPostaux.forEach(item => expandWithCommune(item))
  // await writeAsJSONFile(join(__dirname, '..', 'codes-postaux-full.json'), codesPostaux)
  const codesPostauxCompact = buildCompact(codesPostaux)
  console.log(codesPostauxCompact)
  await writeAsJSONFile(join(__dirname, '..', 'zipCodes.json'), codesPostauxCompact)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
