const logger = require("../../logger/Logger");

class Nuller {
  /**
   * Checks for the given value. If it is null or undefined, it returns the default value
   *
   * @param {Object} value
   * @param {Object} defaultValue if value is null or undefined, this would be returned
   * @returns {Object}
   */
  static nullToValue(value, defaultValue) {
    logger.trace(`value = [${value}] -> defaultValue = [${defaultValue}]`);
    if (value == null || value === undefined) {
      logger.trace(`returning ${defaultValue}`);
      return defaultValue;
    }

    logger.trace(`returning ${value}`);
    return value;
  }

  /**
   *
   * @param {Object} obj
   * @returns {Boolean}
   */
  static isNotNullObject(obj) {
    const res = this.isNullObject(obj, true);
    return !res;
  }

  /**
   *
   * @param {Object} obj
   * @param {Boolean} considerUndefinedAsNull By default, this is true
   * @returns {Boolean}
   */
  static isNullObject(obj, considerUndefinedAsNull = true) {
    if (!considerUndefinedAsNull) {
      return obj == null;
    }

    return obj == null || obj === undefined;
  }

  /**
   *
   * @param {Object} obj
   * @returns {Boolean}
   */
  static isEmpty(obj) {
    return this.isNullObject(obj, true) || obj === "";
  }
}

module.exports = Nuller;
