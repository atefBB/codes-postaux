const index = {}

require('./zipCodes.json').forEach(entry => {
  if (!(entry.zipCode in index)) {
    index[entry.zipCode] = []
  }

  index[entry.zipCode].push(entry)
})

exports.find = function (postalCode) {
  return index[postalCode] || []
}
