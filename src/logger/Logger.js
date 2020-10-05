/* eslint-disable no-unused-expressions */
const fs = require("fs");
const util = require("util");
const enums = require("../utils/common/Enums");
const DateUtils = require("../utils/common/DateUtils");
const config = require("../../br-config");

const logFile = fs.createWriteStream(`debug-${DateUtils.today()}.log`, {
  flags: "a",
});
const logStdout = process.stdout;

const LogLevel = Object.freeze({
  ENTRY: -100,
  EXIT: -99,
  ERROR: 0,
  RESULT: 1,
  PASS: 2,
  FAIL: 3,
  STEP: 4,
  INFO: 5,
  WARN: 6,
  DEBUG: 7,
  VERBOSE: 8,
  TRACE: 9,
});

const DefaultlogLevel = "TRACE";
//let envcfg = config.getConfigForGivenEnv();

const LogLevelToUse = DefaultlogLevel;
// envcfg.logLevel == null || envcfg.logLevel === undefined
//   ? DefaultlogLevel
//   : envcfg.logLevel;

function getStackedFileName() {
  // eslint-disable-next-line no-undef
  `${(__stackpos = 4)}`;
  let fileNameWithExt = "";
  try {
    // eslint-disable-next-line no-undef
    fileNameWithExt = `${__file}.${__ext}`;
  } catch (err) {
    //eat exception
  }
  return fileNameWithExt;
}

function logToFile(d) {
  try {
    logFile.write(`${util.format(d)}\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`ERROR: ${error}`);
  }
}

function logToStdOut(d) {
  try {
    logStdout.write(`${util.format(d)}\n`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`ERROR: ${error}`);
  }
}

function log(givenLevel, setLevel, d) {
  try {
    const givenLevelNumber = enums.getEnumValue(LogLevel, givenLevel);
    const setLevelNumber = enums.getEnumValue(LogLevel, setLevel);

    const currDateTime = DateUtils.currentDateTime();
    const prefix = `[${currDateTime} ${givenLevel.padStart(
      7,
      " "
    )}:${getStackedFileName()}] `;

    let toPrint = "";
    if (d == null || d === undefined || d.length === 0) {
      toPrint = prefix;
    }
    toPrint = prefix + d;

    if (givenLevelNumber <= setLevelNumber) {
      logToStdOut(toPrint);
      logToFile(toPrint);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`ERROR: ${error}`);
  }
}

class Logger {
  static async enterMethod(d) {
    log("ENTRY", LogLevelToUse, d);
  }

  static async exitMethod(d) {
    log("EXIT", LogLevelToUse, d);
  }

  static async info(d) {
    log("INFO", LogLevelToUse, d);
  }

  static async warn(d) {
    log("WARN", LogLevelToUse, d);
  }

  static async debug(d) {
    log("DEBUG", LogLevelToUse, d);
  }

  static async step(d) {
    log("STEP", LogLevelToUse, d);
  }

  static async result(d) {
    log("RESULT", LogLevelToUse, d);
  }

  static async pass(d) {
    log("PASS", LogLevelToUse, d);
  }

  static async fail(d) {
    log("FAIL", LogLevelToUse, d);
    if (config.throwErrorsFromLogger) throw new Error(d);
  }

  static error(d) {
    log("ERROR", LogLevelToUse, d);
  }

  static async verbose(d) {
    log("VERBOSE", LogLevelToUse, d);
  }

  static trace(d) {
    log("TRACE", LogLevelToUse, d);
  }
}

module.exports = Logger;
