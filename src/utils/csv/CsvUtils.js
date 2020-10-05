const fs = require("fs");
const path = require("path");
const csv = require("@fast-csv/parse");
const logger = require("../../logger/Logger");

class CsvUtils {
  async read(file) {
    let fileContent = null;
    if (fs.existsSync(file) == false) {
      fileContent = fs.readFileSync("Data//TestData.csv", { encoding: "utf8" });
    }
    return;
  }

  static csvToArray(fileNameWithPath) {
    //__dirname + "/Pincodelist.csv"
    return fs
      .createReadStream(fileNameWithPath)
      .pipe(csv.parse())
      .on("error", (error) => logger.error(error))
      .on("data", (row) => logger.debug(row))
      .on("end", (rowCount) => logger.debug(`Parsed ${rowCount} rows`));
  }
}

module.exports = CsvUtils;
