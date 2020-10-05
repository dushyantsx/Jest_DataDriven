const StringUtils = require("../utils/common/StringUtils");
const logger = require("../logger/Logger");
const RandomValueGenerator = require("../utils/common/RandomValueGenerator");

const { TestDataObject } = require("../globals/TestObjects");

const tdo = new TestDataObject();
// eslint-disable-next-line no-unused-vars
const uiTestDataObject = tdo.UiTestDataObject();

/**
 * @type {uiTestDataObject[]}
 */
const testDataSets = [];

class DataReader {
  setDataSetObject(rowAndHeaderInJsonObj, jsonObjIndex) {
    logger.enterMethod("setDataSetObject");
    if (rowAndHeaderInJsonObj == null || rowAndHeaderInJsonObj === undefined) {
      logger.warn("No elements in given header header+row object");
      return;
    }

    const dso = tdo.UiTestDataObject();

    if (rowAndHeaderInJsonObj != null && rowAndHeaderInJsonObj !== undefined) {
      const objKeys = Object.keys(rowAndHeaderInJsonObj);
      const objVals = Object.values(rowAndHeaderInJsonObj);

      for (let index = 0; index < objKeys.length; index++) {
        const el = objKeys[index];
        const dataKeySplit = el.split(":");
        const dataKeyUnder = dataKeySplit[0];
        const mainTestDataKey = dataKeySplit[1];

        const generatedVal = RandomValueGenerator.generateValueFor(
          objVals[index]
        );

        switch (dataKeyUnder.toLowerCase().trim()) {
          case "input":
          case "request":
          case "i":
          case "req":
            dso.request[mainTestDataKey] = generatedVal;
            break;
          case "expected":
          case "exp":
          case "e":
            dso.expected[mainTestDataKey] = generatedVal;
            break;
          case "output":
          case "response":
          case "res":
          case "o":
            dso.response[mainTestDataKey] = generatedVal;
            break;
          default:
            dso[dataKeyUnder] = generatedVal;
            break;
        }
      } // for loop ending

      dso.indexId = jsonObjIndex;
    } // if condition ending
    testDataSets.push(dso);
  }

  /**
   * @param {Number} dataSetIndex Specifies data set index to be returned from all data-sets array
   */
  getDataSetObject(dataSetIndex) {
    return testDataSets[dataSetIndex];
  }

  /**
   *
   * @param {uiTestDataObject} dsObj
   * @param {String} keyType Any of input | output | expected
   * @param {String} dataKeyName
   */
  getDataSetKeyValue(dsObj, keyType, dataKeyName) {
    if (dsObj != null && dsObj !== undefined) {
      let objToCheck = dsObj.request;
      switch (keyType.toLowerCase().trim()) {
        case "input":
        case "request":
        case "i":
          objToCheck = dsObj.request;
          break;
        case "output":
        case "response":
        case "o":
          objToCheck = dsObj.response;
          break;
        case "expected":
        case "e":
          objToCheck = dsObj.expected;
          break;
        default:
          logger.error(`Unexpeced case statement -> ${keyType}`);
          break;
      }
      const objKeys = Object.keys(objToCheck);
      const objVals = Object.values(objToCheck);

      for (let index = 0; index < objKeys.length; index++) {
        const el = objKeys[index];

        if (StringUtils.equalsIgnoreCase(el, dataKeyName)) {
          const val = RandomValueGenerator.generateValueFor(objVals[index]);
          return val;
        }
      } // for loop ending
    }
    return "NO-DATA-FOUND";
  }

  /**
   * @deprecated
   *
   * @param {Object} singleJsonRowObject
   * @param {String} dataKeyName
   */
  getDataKeyValue(singleJsonRowObject, dataKeyName) {
    if (singleJsonRowObject != null && singleJsonRowObject !== undefined) {
      const objKeys = Object.keys(singleJsonRowObject);
      const objVals = Object.values(singleJsonRowObject);

      for (let index = 0; index < objKeys.length; index++) {
        const el = objKeys[index];
        const dataKeySplit = el.split(":");
        // eslint-disable-next-line no-unused-vars
        const dataKeyUnder = dataKeySplit[0];
        const mainTestDataKey = dataKeySplit[1];

        if (StringUtils.equalsIgnoreCase(mainTestDataKey, dataKeyName)) {
          const val = RandomValueGenerator.generateValueFor(objVals[index]);
          // replace randomly generated value in object
          singleJsonRowObject[el] = val;
          return val;
        }
      } // for loop ending
    }
    return "NO-DATA-FOUND";
  }
}

module.exports = DataReader;
