import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  Card,
  TextField,
  LinearProgress,
  Grid,
} from "@material-ui/core";
import io from "socket.io-client";

const test_link =
  "magnet:?xt=urn:btih:aaf08110291c21ee4a86893271f1001e8b512452&dn=KNOPPIX_V7.2.0CD-2013-06-16-EN";

const useStyles = makeStyles((theme) => ({
  cards: {
    width: "100%",
    margin: 10,
    padding: 10,
  },
  magnetInput: {
    width: "60ch",
  },
  startButton: {
    marginTop: 10,
    marginLeft: 10,
  },
}));

function App() {
  const classes = useStyles();
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const [torrentMagnet, setTorrentMagnet] = useState(test_link);
  // const [acknowledged, setAcknowledged] = useState(true);

  const [files, setFiles] = useState([]);
  const addFile = (file) => setFiles((files) => [...files, file]);
  const updateFile = (file) => {
    setFiles((files) =>
      files.map((curr) =>
        curr.name === file.name ? Object.assign({}, file) : curr
      )
    );
  };

  // establish socket connection
  useEffect(() => {
    setSocket(io("http://localhost:3001"));
  }, []);

  // subscribe to the socket event
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setSocketConnected(socket.connected);
    });

    socket.on("disconnect", () => {
      setSocketConnected(socket.connected);
    });

    socket.on("fileUpdate", updateFile);
    socket.on("file", addFile);

  }, [socket]);

  const handleDownloadTorrent = () => {
    console.log("Emitting torrent download request");
    socket.emit("start", { torrentMagnet: torrentMagnet });
  };

  return (
    <Grid
      container
      direction="column"
      justify="center"
      alignItems="center"
      className={classes.root}
    >
      <div style={{ marginBottom: 20 }}>
        <div>
          <b>Connection status:</b>{" "}
          {socketConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div>
        <Card className={classes.cards}>
          <TextField
            className={classes.magnetInput}
            id="torrent-magnet"
            label="Torrent Magnet"
            variant="outlined"
            value={torrentMagnet}
            onChange={(event) => {
              const { value } = event.target;
              setTorrentMagnet(value);
            }}
          />

          <Button
            className={classes.startButton}
            type="button"
            label="Start"
            onClick={handleDownloadTorrent}
          >
            Start
          </Button>
        </Card>
      </div>

      <div>
        {files.map((file, index) => (
          <Card key={index.toString()} className={classes.cards}>
            <pre>{file.name}</pre>
            
            <pre>
              {file.downloaded} bytes / {file.length} bytes
            </pre>

            <LinearProgress
              variant="determinate"
              value={(file.downloaded / file.length) * 100}
            />

          </Card>
        ))}
      </div>
    </Grid>
  );
}

export default App;