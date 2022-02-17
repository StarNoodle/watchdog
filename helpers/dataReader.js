export const tsvJSON = (tsv) => {
  const lines = tsv.split("\n");
  const headers = lines.slice(0, 1)[0].split("\t");
  return lines.slice(1, lines.length).map((line) => {
    const data = line.split("\t");
    return headers.reduce((obj, nextKey, index) => {
      obj[nextKey] = data[index];
      return obj;
    }, {});
  });
};

export const csvJSON = (csv) => {
  var lines = csv.split("\n");

  var result = [];
  var headers = lines[0].split(";");

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(";");

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  return result;
};
