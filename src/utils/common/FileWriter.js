const mkdirp = require("mkdirp");
const fs = require("fs");
const abs = require("abs");
const typpy = require("typpy");
const path = require("path");

/**
 * FileWriter
 * Create the directory structure and then create the file.
 *
 * @name FileWriter
 * @function
 * @param {String} outputPath The path to the file you want to create.
 * @param {String|Object} data The file content. If an Array/Object is provided, it will be stringified.
 * @param {Function} cb The callback function.
 */
function FileWriter(outputPath, data, cb) {
  outputPath = abs(outputPath);
  const dirname = path.dirname(outputPath);
  mkdirp(dirname, (err) => {
    if (err) {
      return cb(err);
    }
    let str = data;
    if (typpy(data, Array) || typpy(data, Object)) {
      str = JSON.stringify(data, null, 2);
    }
    fs.writeFile(outputPath, str, (error) => cb(error, data));
  });
}

/**
 * FileWriter.syncClose
 * The sync and close version of the function.
 *
 * @name FileWriter.syncClose
 * @function
 * @param {String} outputPath The path to the file you want to create.
 * @param {String|Object} data The file content. If an Array/Object is provided, it will be stringified.
 * @param {Boolean} isAppend Specify if file needs to be appended or overwritten
 * @returns {String|Object} The content written in the file. If an object was provided, the stringified version will *not* be returned but the raw value.
 */
FileWriter.syncClose = (outputPath, data, isAppend) => {
  outputPath = abs(outputPath);
  const dirname = path.dirname(outputPath);
  mkdirp.sync(dirname);
  let str = data;
  if (typpy(data, Array) || typpy(data, Object)) {
    str = JSON.stringify(data, null, 2);
  }

  let flag = "w";
  if (isAppend) flag = "a";

  const fd = fs.openSync(outputPath, flag);
  fs.writeFileSync(fd, str, null, null);
  fs.closeSync(fd);
  return data;
};

/**
 * FileWriter.sync
 * The sync version of the function.
 *
 * @name FileWriter.sync
 * @function
 * @param {String} outputPath The path to the file you want to create.
 * @param {String|Object} data The file content. If an Array/Object is provided, it will be stringified.
 * @param {Boolean} isAppend Specify if file needs to be appended or overwritten
 * @returns {String|Object} The content written in the file. If an object was provided, the stringified version will *not* be returned but the raw value.
 */
FileWriter.sync = (outputPath, data, isAppend) => {
  outputPath = abs(outputPath);
  const dirname = path.dirname(outputPath);
  mkdirp.sync(dirname);
  let str = data;
  if (typpy(data, Array) || typpy(data, Object)) {
    str = JSON.stringify(data, null, 2);
  }
  if (isAppend) fs.appendFileSync(outputPath, str);
  else fs.writeFileSync(outputPath, str);
  return data;
};

module.exports = FileWriter;

/* Example to use
"use strict";

const FileWriter = require("../lib");

// Write a text file
FileWriter(`${__dirname}/foo/bar/output.txt`, "Hello World", (err, data) => {
    console.log(err || data);
});


// Write a json syncronously
FileWriter.sync(`${__dirname}/bar/bar/output.json`, {
    hello: "world"
});
// .
// ├── bar
// │   └── bar
// │       └── output.json
// └── foo
//     └── bar
//         └── output.txt
*/
