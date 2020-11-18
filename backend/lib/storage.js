const archiver = require("archiver");
const crypto = require("crypto");
const mkdirp = require("mkdirp");
const fs = require("fs");
const rootPath = process.cwd() + process.env.PARENT_TEMP_FOLDER;

var storage = {
  /**
   * @param {String} source
   * @param {String} out
   * @returns {Promise}
   */
  zipDirectory: function (source, out) {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
      archive
        .directory(source, false)
        .on("error", (err) => reject(err))
        .pipe(stream);

      stream.on("close", () => resolve());
      archive.finalize();
    });
  },

  generateIdentifier: function () {
    return crypto.randomBytes(20).toString("hex");
  },

  createDirectoryForIdentifier: function (identifier) {
    var tempPath = rootPath + process.env.TORRENTS_FOLDER + "/" + identifier + "/";
    mkdirp.sync(tempPath);
    return tempPath;
  },

  createZipForIdentifier: function (identifier) {
    return rootPath + process.env.DOWNLOADS_FOLDER + "/" + identifier + ".zip";
  },
};

module.exports = storage;
