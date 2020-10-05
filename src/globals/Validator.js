require(`../globals/MyTypeDefs`);
const StringUtils = require(`../utils/common/StringUtils`);
const logger = require(`../logger/Logger`);
const config = require("../../br-config");
const FileSystem = require("../utils/common/FileSystem");
const errors = require("../errors/CustomErrors");

class Validator {
  /**
   *
   * @param {String} valFileName Specifies validation file name
   * @param {String} valTcIdentifier Specifies test case identifier
   * @param {String} valIdentifier Specifies validation identifier
   * @returns {Boolean}
   */
  isValidationEnabled(valFileName, valTcIdentifier, valIdentifier) {
    logger.enterMethod();
    const valFileNameWithPath = `${config.getLocationValidatorsMetaForGivenEnv()}/${valFileName}.json`;

    const valTcObjs = this.getValidationTestCaseObjectsFromFile(
      valFileNameWithPath
    );
    if (StringUtils.isEmptyObject(valTcObjs) || valTcObjs.length === 0) {
      logger.exitMethod(
        "No validation objects found for given test case to check if validation to be done or not; returning false"
      );
      return false;
    }

    logger.trace(`JSON parsed as: ${valTcObjs}`);
    const valObjs = this.getValidtatorsForGivenTestCase(
      valTcObjs,
      valTcIdentifier
    );
    if (!StringUtils.isEmptyObject(valObjs)) {
      for (let index = 0; index < valObjs.length; index++) {
        const valObj = valObjs[index];
        const valId = valObj.validation_identifier;
        if (StringUtils.equalsIgnoreCase(valId, valIdentifier)) {
          logger.exitMethod(
            `Validation found to be enabled for ${valTcIdentifier}->${valIdentifier}`
          );
          return valObj.enabled;
        }
      }
    }
    // else {
    //   throw new Error(
    //     `No test case found with identifier [${valTcIdentifier}] found in given validation-sets repository given at ${valFileNameWithPath}`
    //   );
    // }
    logger.exitMethod();
    return false;
  }

  /**
   *
   * @param {ValidationTestCaseObjects} valObjs
   * @param {String} tcIdentifier
   * @returns {ValidationObject[]}
   */
  getValidtatorsForGivenTestCase(valObjs, tcIdentifier) {
    if (StringUtils.isEmptyObject(valObjs)) {
      return null;
    }
    if (StringUtils.isEmpty(tcIdentifier)) {
      return null;
    }
    for (let index = 0; index < valObjs.length; index++) {
      if (
        StringUtils.equalsIgnoreCase(valObjs[index].tc_identifier, tcIdentifier)
      ) {
        return valObjs[index].validations;
      }
    }
    return null;
  }

  /**
   * @param {String} valJsonFileWithPath
   * @returns {ValidationTestCaseObjects}
   */
  getValidationTestCaseObjectsFromFile(valJsonFileWithPath) {
    if (!FileSystem.fileExistsSync(valJsonFileWithPath))
      throw new errors.FileNotFoundError(
        `File not found: ${valJsonFileWithPath}`
      );

    const json = FileSystem.readFileSync(valJsonFileWithPath);
    return JSON.parse(json);
  }
}

module.exports = Validator;
