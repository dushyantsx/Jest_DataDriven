const StringUtils = require("./StringUtils");

class DateUtils {
  /**
   * @param {Date} date
   * @param {String} separator
   * @returns {String} returns date in yyyymmdd format separated by given separator
   */
  static formatDate(date, separator) {
    let d;
    if (date === undefined || date === "") d = new Date();
    else d = new Date(date);

    let sep;
    if (separator === undefined || separator === "") sep = "";
    else sep = separator.substring(0, 1);

    let month = d.getMonth() + 1;
    let day = d.getDate();
    const year = d.getFullYear();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;

    return [year, month, day].join(sep);
  }

  /**
   * @param {Date} date
   * @param {String} separator
   * @returns {String} returns date in yyyymmdd format separated by given separator
   */
  static dateMMDDYYYY(date, separator) {
    let d;
    if (date === undefined || date === "") d = new Date();
    else d = new Date(date);

    let sep;
    if (separator === undefined || separator === "") sep = "";
    else sep = separator.substring(0, 1);

    let month = d.getMonth() + 1;
    let day = d.getDate();
    const year = d.getFullYear();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;

    return [month, day, year].join(sep);
  }

  /**
   *
   * @param {Date} date
   */
  static now(date) {
    let d;
    if (date === undefined || date === "") d = new Date();
    else d = new Date(date);

    let hh = d.getHours();
    let mm = d.getMinutes();
    let ss = d.getSeconds();
    let ms = d.getMilliseconds();

    hh = (hh < 10 ? "0" : "") + hh;
    mm = (mm < 10 ? "0" : "") + mm;
    ss = (ss < 10 ? "0" : "") + ss;
    ms = (ms < 100 ? "0" : "") + ms;

    const dt = DateUtils.formatDate(d, "-");

    return `${dt} ${hh}:${mm}:${ss}.${ms}`;
  }

  /**
   *
   * @param {String} date
   */
  static convertISOstringToYYYYMMDDhhmmss(date) {
    return date.replace(/T/, " ").replace(/\..+/, "");
  }

  static today() {
    return this.formatDate(new Date());
  }

  /**
   * @returns {Date}
   */
  static tomorrowDate() {
    const today = new Date();
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);

    return tmr;
  }

  static tomorrow() {
    return this.formatDate(this.tomorrowDate());
  }

  static yesterday() {
    const today = new Date();
    const ytd = new Date(today);
    ytd.setDate(ytd.getDate() - 1);

    return ytd;
  }

  static currentDateTime() {
    return this.now(new Date());
  }

  static yyyymmddhhmmssms() {
    let n = this.currentDateTime();
    n = StringUtils.replaceAll(n, "-", "");
    n = StringUtils.replaceAll(n, ":", "");
    n = StringUtils.replaceAll(n, "\\.", "");
    n = StringUtils.replaceAll(n, " ", "");
    return n;
  }

  static timePassed(initialTime, msAfter) {
    const n = this.yyyymmddhhmmssms() * 1;
    const maxTime = initialTime * 1 + msAfter;
    return maxTime < n;
  }

  /**
   * @param {Date} date
   * @param {String} separator
   * @returns {String} returns date in yyyymmdd format separated by given separator
   */
  static formatDateTo(date, separator) {
    let d;
    if (date === undefined || date === "") d = new Date();
    else d = new Date(date);

    let sep;
    if (separator === undefined || separator === "") sep = "";
    else sep = separator.substring(0, 1);

    let month = d.getMonth() + 1;
    let day = d.getDate();
    const year = d.getFullYear();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;

    return [day, month, year].join(sep);
  }

  /**
   * @param {Date} date
   * @param {String} separator
   * @returns {String} returns date in yyyymmdd format separated by given separator
   */
  static formatDateDDMMYYYY(date, separator) {
    let d;
    if (date === undefined || date === "") d = new Date();
    else d = new Date(date);

    let sep;
    if (separator === undefined || separator === "") sep = "";
    else sep = separator.substring(0, 1);

    let month = d.getMonth() + 1;
    let day = d.getDate();
    const year = d.getFullYear();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;

    return [day, month, year].join(sep);
  }
}

module.exports = DateUtils;
