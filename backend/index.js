require("dotenv").config();

/* Torrent Stream */
var torrentStream = require("torrent-stream");
var mkdirp = require("mkdirp");
var rootPath = process.cwd();
var fs = require("fs");
var crypto = require("crypto");
/* Torrent Stream */

/* Express/Server Setup */
var http = require("http");
var cors = require("cors");
var express = require("express");
var app = express();
var server = http.createServer(app);
var io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});
server.listen(process.env.SERVER_PORT);
app.use(cors());
app.get("/", function (req, res) {
  console.log("Index requested");
  res.json("{}");
});
/* Express/Server Setup */

function generateTempDirectoryName() {
  return crypto.randomBytes(20).toString("hex");
}

function generateTempDirectory() {
  var tempPath = rootPath + "/downloads/" + generateTempDirectoryName() + "/";
  mkdirp.sync(tempPath);
  return tempPath;
}

io.on("connection", function (socket) {
  console.log("Connected succesfully to the socket ...");
  var engine = null;

  socket.on("start", function (data) {
    console.log(
      "Requested torrent download start for magnet: " + data.torrentMagnet
    );

    engine = torrentStream(data.torrentMagnet);

    engine.on("ready", function (e) {
      // Acknowledge Request
      socket.emit("acknowledge", { acknowledged: true });

      // Send torrent file list
      socket.emit(
        "files",
        engine.files.map((file) => ({
          name: file.name,
          length: file.length,
          downloaded: 0,
        }))
      );

      // Download files / send progress updates
      var downloadPath = generateTempDirectory();
      engine.files.forEach(function (file) {
        console.log("Starting: " + file.name);

        var bytesRead = 0;
        var readStream = file.createReadStream();
        var writeStream = fs.createWriteStream(downloadPath + file.name);
        readStream.pipe(writeStream);

        readStream.on("data", function (data) {
          bytesRead += data.length;

          socket.emit("fileUpdate", {
            name: file.name,
            length: file.length,
            downloaded: bytesRead,
          });
        });

        readStream.on("end", function () {
          console.log("Completed: " + file.name);
        });

      });
    });
  });

  socket.on("disconnect", function (data) {
    console.log("Socket has disconnected");
  });
});
