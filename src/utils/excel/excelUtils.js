const xlsx = require("xlsx");
const XlsxPopulate = require("xlsx-populate");
const logger = require("../../logger/Logger");
const Nuller = require("../common/Nuller");

class excelUtils {
  async sheetAs2dArray(filePath, sheetName) {
    const values = this.sheetAs2dArrayAsync(filePath, sheetName, true);
    return values
      .then((vals) => {
        return vals;
      })
      .catch((err) => logger.error(err));
  }

  async sheetAs2dArrayAsync(filePath, sheetName, removeHeaderRow = false) {
    //try {
    return XlsxPopulate.fromFileAsync(filePath)
      .then((workbook) => {
        // Modify the workbook.
        const value = workbook.sheet(sheetName).cell("A1").value();

        // Log the value.
        logger.verbose(value);

        // Get 2D array of all values in the worksheet.
        const values = workbook.sheet(sheetName).usedRange().value();
        logger.verbose(
          `2D Array of all values in the given sheet ${sheetName} -----> ${values}`
        );

        if (removeHeaderRow) {
          values.splice(0, 1);
        }
        return values;
      })
      .catch((err) => logger.error(err));
  }

  /**
   * Reads given sheet in given file and returns JSON array of the sheet.
   * It defaults empty cells to null and does not return any blank rows.
   *
   * @param {String} filePath Specifies file path
   * @param {String} sheetName Specifies sheet name which needs to be read
   * @returns {JSON}
   */
  sheetOnNameAsJsonArray(filePath, sheetName) {
    if (Nuller.isNullObject(filePath)) {
      return null;
    }

    const wb = xlsx.readFile(filePath);

    if (Nuller.isNullObject(sheetName)) {
      sheetName = wb.SheetNames[0];
    }

    const ws = wb.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(ws, {
      raw: true,
      defval: null,
      blankrows: false,
    });
  }
}
module.exports = excelUtils;
