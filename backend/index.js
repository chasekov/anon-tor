require("dotenv").config();

/* libs */
const storage = require("./lib/storage");

/* Torrent Stream */
var torrentStream = require("torrent-stream");
var fs = require("fs");
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
/* Express/Server Setup */

app.get("/download", function (req, res, next) {
  // Get the download sid
  var downloadSid = req.query.sid;
  res.download(
    __dirname + "/var/downloads/" + downloadSid + ".zip",
    downloadSid + ".zip"
  );
});

io.on("connection", function (socket) {
  console.log("Connected succesfully to the socket ...");
  var engine = null;

  socket.on("start", function (data) {
    engine = torrentStream(data.torrentMagnet);

    engine.on("ready", function (e) {
      // Acknowledge Request
      socket.emit("acknowledge", { acknowledged: true });

      // Send torrent file list
      socket.emit(
        "files",
        engine.files.map((file) => ({
          name: file.name,
          progress: 0,
          downloaded: 0,
          length: file.length,
        }))
      );

      // Download files / send progress updates
      var identifier = storage.generateIdentifier();
      var downloadPath = storage.createDirectoryForIdentifier(identifier);
      var zipPath = storage.createZipForIdentifier(identifier);

      var finishedFiles = 0;
      var totalFiles = engine.files.length;

      engine.files.forEach(function (file) {
        console.log("Starting: " + file.name);

        var bytesRead = 0;
        var prevProgress = 0;

        var readStream = file.createReadStream();
        var writeStream = fs.createWriteStream(downloadPath + file.name);

        writeStream.on("error", function (err) {
          console.log(err);
        });

        readStream.on("error", function (err) {
          console.log(err);
        });

        readStream.on("data", function (data) {
          bytesRead += data.length;

          var newProgress = (bytesRead / file.length) * 100;

          if (newProgress - prevProgress > 1 || newProgress == 100) {
            // emit a file update
            socket.emit("fileUpdate", {
              name: file.name,
              progress: newProgress,
              downloaded: bytesRead,
              length: file.length,
            });

            prevProgress = newProgress;
          }
        });

        readStream.pipe(writeStream).on("finish", function () {
          finishedFiles++;

          if (finishedFiles == totalFiles) {
            storage.zipDirectory(downloadPath, zipPath).then(() => {
              console.log(zipPath);

              socket.emit("downloadLink", {
                identifier,
              });
            });
          }
        });
      });
    });
  });

  socket.on("disconnect", function (data) {
    console.log("Socket has disconnected");
  });
});
