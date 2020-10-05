const fs = require("fs");
const fse = require("fs-extra");
const logger = require("../../logger/Logger");
const ArrayUtils = require("./ArrayUtils");

class FileSystem {
  async deleteFile(filePath) {
    fs.unlink(filePath, () => {
      //if (err) throw err;
      logger.verbose(`Successfully deleted file: ${filePath}`);
    });
  }

  async deleteFolder(folderPath) {
    fs.rmdir(folderPath, { recursive: false }, () => {
      //if (err) throw err;
      logger.verbose(`Successfully deleted folder: ${folderPath}`);
    });
  }

  static readFileSync(filePath) {
    return fs.readFileSync(filePath, () => {
      //if (err) throw err;
      logger.verbose(`Successfully read file: ${filePath}`);
    });
  }

  static deleteFolderRecursivelySync(folderPath) {
    fs.rmdirSync(folderPath, { recursive: true }, () => {
      //if (err) throw err;
      logger.verbose(
        `Successfully deleted folder(s) recursively: ${folderPath}`
      );
    });
  }

  static fileExistsSync(filePath) {
    return fs.existsSync(filePath);
  }

  static async deleteFolderRecursively(folderPath) {
    fs.rmdir(folderPath, { recursive: true }, () => {
      //if (err) throw err;
      logger.verbose(
        `Successfully deleted folder(s) recursively: ${folderPath}`
      );
    });
  }

  static deleteAllFilesInFolder(folderPath) {
    fse.emptyDirSync(folderPath);
  }

  async createFolder(folderPath) {
    logger.verbose(`Creating folder: ${folderPath}`);
    fs.mkdir(folderPath, { recursive: false }, () => {
      //if (err) throw new Error(err);
      logger.verbose(`Successfully created folder: ${folderPath}`);
    });
  }

  async createFolderRecursively(folderPath) {
    fs.mkdir(folderPath, { recursive: true }, () => {
      //if (err) throw err;
      logger.verbose(
        `Successfully created folder(s) recursively: ${folderPath}`
      );
    });
  }

  static createFolderRecursivelySync(folderPath) {
    fs.mkdirSync(folderPath, { recursive: true });
    logger.verbose(`Successfully created folder(s) recursively: ${folderPath}`);
  }

  async renameFile(srcFile, tgtFile) {
    fs.rename(srcFile, tgtFile, () => {
      //if (err) throw err;
      logger.verbose("renamed complete");
    });
  }

  static getFiles(folderPath) {
    const lf = fs.readdirSync(folderPath);
    const files = ArrayUtils.removeNullAndUndefinedElements(lf);

    return files;
  }
}

module.exports = FileSystem;
