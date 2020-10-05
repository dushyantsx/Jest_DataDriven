/* eslint-disable no-caller */
/* eslint-disable no-restricted-properties */
let stackpos = 1;
let resultData = "";

/** set stack position number from where values would be fetched in stack: __stackpos */
Object.defineProperty(global, "__stackpos", {
  get: function () {
    return stackpos;
  },
  set: function (value) {
    stackpos = value;
  },
});

/** begin setting magic properties into global (required for other functions) */
Object.defineProperty(global, "__stack", {
  get: function () {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
      return stack;
    };
    const err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    const { stack } = err;
    Error.prepareStackTrace = orig;
    return stack;
  },
});

/** returns line number when placing this in your code: __line */
Object.defineProperty(global, "__line", {
  get: function () {
    // eslint-disable-next-line no-undef
    return __stack[__stackpos].getLineNumber();
  },
});

/** return filename (without directory path or file extension) when placing this in your code: __file */
Object.defineProperty(global, "__file", {
  get: function () {
    // eslint-disable-next-line no-undef
    const filePieces = __stack[__stackpos]
      .getFileName()
      .split(/[\\/]/)
      .slice(-1)[0]
      .split(".");
    return filePieces.slice(0, filePieces.length - 1).join(".");
  },
});

/**
 * return file extension (without preceding period) when placing this in your code: __ext
 */
Object.defineProperty(global, "__ext", {
  get: function () {
    // eslint-disable-next-line no-undef
    return __stack[__stackpos].getFileName().split(".").slice(-1)[0];
  },
});

/**
 * return current function
 * @source https://gist.github.com/lordvlad/ec81834ddff73aaa1ab0
 */
Object.defineProperty(global, "__func", {
  get: function () {
    return (
      (arguments.callee.caller && arguments.callee.caller.name) || "(anonymous)"
    );
  },
});

/** return base path of project */
Object.defineProperty(global, "__base", {
  get: function () {
    return process.cwd();
  },
});

/** returns filename, a colon, and line number when placing this in your code: __fili */
Object.defineProperty(global, "__fili", {
  get: function () {
    let filid = ":";
    if (typeof global.__filid !== "undefined" && global.__filid) {
      filid = global.__filid;
    }

    return (
      // eslint-disable-next-line no-undef
      __stack[__stackpos].getFileName() +
      filid +
      // eslint-disable-next-line no-undef
      __stack[__stackpos].getLineNumber()
    );
  },
});

/** return src path of project */
Object.defineProperty(global, "__src", {
  get: function () {
    // eslint-disable-next-line no-undef
    return `${__base}/src`;
  },
});

/** return utils path of project */
Object.defineProperty(global, "__utils", {
  get: function () {
    // eslint-disable-next-line no-undef
    return `${__src}/utils`;
  },
});

/** Used to store of result data during execution in global context */
Object.defineProperty(global, "__resultData", {
  get: function () {
    return resultData;
  },
  set: function (value) {
    resultData = value;
  },
  // ,
  // clear() {
  //   resultData = "";
  // }
});

process.env.SELENIUM_PROMISE_MANAGER = 0;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// console.log(`${__utils}`);

// Parse and set command line parameters
const config = require("./br-config");

config.parse(process.argv);

// // print process.argv
// process.argv.forEach(function (val, index, array) {
//   console.log(index + ': ' + val + "    : " + array);
//   process.env.name = "pankaj";
// });
