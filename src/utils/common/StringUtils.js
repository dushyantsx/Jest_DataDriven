// const logger = require("../../logger/Logger");

class StringUtils {
  /**
   *
   * @param {String} str
   * @param {String} defaultStr
   */
  static defaultIfEmpty(str, defaultStr) {
    if (this.isEmpty(str)) {
      return defaultStr;
    }

    return str;
  }

  /**
   *
   * @param {String} value
   */
  static isEmpty(value) {
    if (value == null || value === undefined || value.length === 0) {
      return true;
    }

    //if (value.trim() == "") return true;
    //Above commented line throws .trim() is not a function

    return false;
  }

  /**
   *
   * @param {Object} obj
   */
  static isEmptyObject(obj) {
    if (obj == null || obj === undefined || JSON.stringify(obj) === "{}") {
      return true;
    }

    return false;
  }

  /**
   * Checks if {src} equals {searchText} or not case-insensitively
   *
   * @param {String} src Specifies text with which searchText would be compared
   * @param {String} searchText Specifies text to be searched
   * @returns {Boolean}
   */
  static equalsIgnoreCase(src, searchText) {
    if (this.isEmpty(src) && this.isEmpty(searchText)) return true;
    if (
      (this.isEmpty(src) && !this.isEmpty(searchText)) ||
      (!this.isEmpty(src) && this.isEmpty(searchText))
    )
      return false;

    return src.toUpperCase().trim() === searchText.toUpperCase().trim();
  }

  /**
   * Checks if {src} contains {searchText} or not case-insensitively
   *
   * @param {String} src Specifies text in which searchText would be searched
   * @param {String} searchText Specifies text to be searched
   * @returns {Boolean}
   */
  static containsIgnoreCase(src, searchText) {
    //logger.trace(`containsIgnoreCase: Analyzing ${src} for ${searchText}`);
    if (this.isEmpty(src) && this.isEmpty(searchText)) return true;
    if (
      this.isEmpty(src.toString().trim()) &&
      this.isEmpty(searchText.toString().trim())
    )
      return true;

    if (
      (this.isEmpty(src) && !this.isEmpty(searchText)) ||
      (!this.isEmpty(src) && this.isEmpty(searchText))
    ) {
      return false;
    }

    const strInSearch = src.toString().trim().toUpperCase();
    const strToSearch = searchText.toString().trim().toUpperCase();
    const found = strInSearch.indexOf(strToSearch) !== -1;
    // logger.trace(
    //   `Searching ${strToSearch} in ${strInSearch} resulted as: ${found}`
    // );
    return found;
  }

  /**
   * Checks if {src} contains any of {searchText[]} or not case-insensitively
   *
   * @param {String} src Specifies text in which searchText would be searched
   * @param {String[]} searchTexts Specifies text to be searched
   * @returns {Boolean}
   */
  static containsIgnoreCaseAny(src, searchTexts) {
    let found = false;
    if (this.isEmpty(src) && this.isEmpty(searchTexts)) return true;
    if (
      (this.isEmpty(src) && !this.isEmpty(searchTexts)) ||
      (!this.isEmpty(src) && this.isEmpty(searchTexts))
    ) {
      return false;
    }

    for (let index = 0; index < searchTexts.length; index++) {
      const st = searchTexts[index];
      // logger.trace(
      //   `containsIgnoreCaseAny: Analyzing ${src} for ${st} from index ${index}`
      // );
      found = this.containsIgnoreCase(src, st);
      if (found) break;
    }

    return found;
  }

  /**
   * @description Replaces all strings found in given string; Regular expression based replacement
   *
   * @param {String} str Specifies string in which to find and replace
   * @param {String} strToFind Specifies string which would be found in given {str} and replaced
   * @param {String} replaceWith Specifies string {replaceWith} which would be replaced in place of {strToFind}
   */
  static replaceAll(str, strToFind, replaceWith) {
    return str.replace(new RegExp(strToFind, "g"), replaceWith);
  }

  /**
   * @description Replaces all strings found in given string; String based replacement
   *
   * @param {String} fullS Specifies in which string to search and replace
   * @param {String} searchS Specifies string which would be found in given {fullS} and replaced
   * @param {String} replaceS Specifies string {replaceS} which would be replaced in place of {searchS}
   */
  static replaceString(fullS, searchS, replaceS) {
    return fullS.split(searchS).join(replaceS);
  }

  /**
   * @description Extracts string between given strings
   *
   * @param {String} str Specifies in which string to extracted
   * @param {String} strFrom Specifies string which from where substring would be fetched
   * @param {String} strTo Specifies string upto which string would be fetched
   */
  static substringBetween(str, strFrom, strTo) {
    if (this.isEmpty(str)) return str;

    let startIndex = 0;
    let endIndex = str.length;
    if (!this.isEmpty(strFrom)) {
      startIndex = str.indexOf(strFrom) + strFrom.length;
      if (startIndex === -1) return str;
    }
    if (!this.isEmpty(strTo)) {
      endIndex = str.indexOf(strTo);
      if (endIndex === -1) return str;
    }

    return str.substring(startIndex, endIndex);
  }

  /**
   * @description Extracts string between given strings by ignoring case
   *
   * @param {String} str Specifies in which string to extracted
   * @param {String} strFrom Specifies string which from where substring would be fetched
   * @param {String} strTo Specifies string upto which string would be fetched
   */
  static substringBetweenIgnoreCase(str, strFrom, strTo) {
    if (this.isEmpty(str)) return str;

    let startIndex = 0;
    let endIndex = str.length;
    if (!this.isEmpty(strFrom)) {
      startIndex =
        str.toUpperCase().indexOf(strFrom.toUpperCase()) + strFrom.length;
      if (startIndex === -1) return str;
    }
    if (!this.isEmpty(strTo)) {
      endIndex = str.toUpperCase().indexOf(strTo.toUpperCase(), startIndex);
      if (endIndex === -1) return str;
    }

    return str.substring(startIndex, endIndex);
  }

  /**
   * @description Extracts only numbers from given string and returns
   * @param {String} str
   * @returns {String}
   */
  static extractNumbers(str) {
    if (this.isEmpty(str)) return "";

    const numbers = str.match(/(\d+)/g);
    return numbers[0];
  }

  /**
   * @description Trims starting and ending characters from given string
   * @param {String} str
   * @param {String} charToRemove
   */
  static trimStartEnd(str, charToRemove) {
    str = this.trimStart(str, charToRemove);
    str = this.trimEnd(str, charToRemove);
    return str;
  }

  /**
   * @description Trims starting characters from given string
   * @param {String} str
   * @param {String} charToRemove
   */
  static trimStart(str, charToRemove) {
    if (this.isEmpty(str)) return str;

    while (str.charAt(0) === charToRemove) {
      str = str.substring(1);
    }

    return str;
  }

  /**
   * @description Trims ending characters from given string
   * @param {String} str
   * @param {String} charToRemove
   */
  static trimEnd(str, charToRemove) {
    if (this.isEmpty(str)) return str;

    while (str.charAt(str.length - 1) === charToRemove) {
      str = str.substring(0, str.length - 1);
    }

    return str;
  }

  /**
   * Checks if {srcTexts[]} contains any of {searchText[]} or not case-insensitively
   *
   * @param {String[]} srcTexts Specifies text in which searchText would be searched
   * @param {String[]} searchTexts Specifies text to be searched
   * @returns {Boolean}
   */
  static containsIgnoreCaseAnyPosition(srcTexts, searchTexts) {
    let found = false;
    if (this.isEmpty(srcTexts) && this.isEmpty(searchTexts)) return true;
    if (
      (this.isEmpty(srcTexts) && !this.isEmpty(searchTexts)) ||
      (!this.isEmpty(srcTexts) && this.isEmpty(searchTexts))
    ) {
      return false;
    }

    for (let index = 0; index < srcTexts.length; index++) {
      const src = srcTexts[index];
      found = this.containsIgnoreCaseAny(src, searchTexts);
      if (found) break;
    }

    return found;
  }
}

// loop array
// compare and source and target based on trim,ignorecase,remove spaces, remove all numbers/special chars,

module.exports = StringUtils;
