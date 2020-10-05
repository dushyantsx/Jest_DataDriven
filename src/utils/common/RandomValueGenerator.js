const StringUtils = require("./StringUtils");
const logger = require("../../logger/Logger");

const supportedRandomKeywords = [
  "${RANDOMALNUM",
  "${RANDOMALPHA",
  "${RANDOMNUM",
];

class RandomValueGenerator {
  /**
   * @description Generates random string for given string and returns
   * if empty; it would generate any random string
   * @param {String} str Specifies string in which random value would be placed;
   */
  static generateValueFor(str) {
    logger.enterMethod(`generateValueFor: Generating value for ${str}`);
    try {
      if (
        !StringUtils.isEmpty(str) &&
        StringUtils.containsIgnoreCaseAny(str, supportedRandomKeywords)
      ) {
        const rndType = StringUtils.substringBetweenIgnoreCase(
          str,
          "${RANDOM",
          "#"
        );
        const rndKeyword = `\${RANDOM${rndType}#`;
        let len =
          StringUtils.substringBetweenIgnoreCase(str, rndKeyword, "}") * 1;
        if (len < 0) len = 5;

        let rndStr = "";
        logger.debug(
          `RandomType: ${rndType} -> RandomKeyword: ${rndKeyword} -> Length: ${len}`
        );
        switch (rndType.toUpperCase()) {
          case "ALPHA":
            rndStr = this.generateRandomAlphabetic(len);
            break;
          case "ALPHANUM":
            rndStr = this.generateRandomAlphaNumeric(len);
            break;
          case "NUM":
            rndStr = this.generateNumeric(len);
            break;
          default:
            break;
        }

        const genValue = StringUtils.replaceString(
          str,
          `${rndKeyword + len}}`,
          rndStr
        );
        logger.debug(`Generated value to recursive call: ${genValue}`);

        logger.exitMethod("generateValueFor after generation");
        // Call recursively to generate and replace random strings
        return this.generateValueFor(genValue);
      }
    } catch (err) {
      logger.error(err);
    }
    logger.exitMethod("generateValueFor");
    return str;
  }

  /**
   * @description Generates numeric string of given length; by default of length = 5
   * @param {Number} len Specifies length of random string to be generated; default = 5
   */
  static generateNumeric(len) {
    const numbers = "0123456789";

    return this.generateRandom(numbers, len);
  }

  /**
   * @description Generates alphabetic string of given length; by default of length = 5
   * @param {Number} len Specifies length of random string to be generated; default = 5
   */
  static generateRandomAlphabetic(len) {
    const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    return this.generateRandom(alphabets, len);
  }

  /**
   * @description Generates alphanumeric string of given length; by default of length = 5
   * @param {Number} len Specifies length of random string to be generated; default = 5
   */
  static generateRandomAlphaNumeric(len) {
    const alphaNumChars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    return this.generateRandom(alphaNumChars, len);
  }

  /**
   * @description Generates random string of given length from given characters; by default of length = 5
   * @param {Number} chars Specifies list of characters to be used in random string generation
   * @param {Number} len Specifies length of random string to be generated; default = 5
   */
  static generateRandom(chars, len) {
    if (len == null || len === undefined || len * 1 <= 0) {
      len = 5;
    }
    if (StringUtils.isEmpty(chars)) {
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    }
    let result = "";
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    logger.debug(`Generated random string: ${result}`);
    return result;
  }
}

module.exports = RandomValueGenerator;
