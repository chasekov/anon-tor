require("dotenv").config();

var torrentStream = require("torrent-stream");

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

// Register the index route of your app that returns the HTML file
app.get("/", function (req, res) {
  console.log("Index requested");
  res.json("{}");
});

// Handle connection
io.on("connection", function (socket) {
  console.log("Connected succesfully to the socket ...");
  var engine = null;

  socket.on("start", function (data) {
    console.log(
      "Requested torrent download start for magnet: " + data.torrentMagnet
    );

    engine = torrentStream(data.torrentMagnet);

    engine.on("ready", function (e) {
      engine.files.forEach(function (file) {
        socket.emit("file", {
          name: file.name,
          length: file.length,
          downloaded: 0,
        });

        var stream = file.createReadStream();
        var bytesRead = 0;

        stream.on("data", function (data) {
          bytesRead += data.length;

          socket.emit("fileUpdate", {
            name: file.name,
            length: file.length,
            downloaded: bytesRead,
          });
        });

        // // stream is readable stream to containing the file content
      });
    });

    socket.emit("acknowledge", { acknowledged: true });
  });

  socket.on("disconnect", function (data) {
    console.log("Socket has disconnected");
  });
});
