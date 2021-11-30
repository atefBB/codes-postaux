const index = {};

require("./fullZipCodes.json")
  .map((entry) => ({
    zipCode: entry.codePostal,
    townCode: entry.codeCommune,
    townName: entry.nomCommune,
    routingLabel: entry.libelleAcheminement,
  }))
  .forEach((entry) => {
    if (!(entry.zipCode in index)) {
      index[entry.zipCode] = [];
    }

    index[entry.zipCode].push(entry);
  });

exports.find = function (postalCode) {
  return index[postalCode] || [];
};
