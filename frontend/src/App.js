import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import MuiAlert from "@material-ui/lab/Alert";
import {
  CircularProgress,
  Button,
  Card,
  TextField,
  LinearProgress,
  Grid,
} from "@material-ui/core";
import io from "socket.io-client";

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const test_link =
  "magnet:?xt=urn:btih:53036b45c50376fdfd14e8be4c17b4ff71740580&dn=Piano+Sheet+Music+by+Grigor+Iliev";
//"magnet:?xt=urn:btih:f15f3c9bdc36e88613e226c0c6466123c460ce37&dn=comics-in-quarantine-solving-problems-s-01-e-16";

const useStyles = makeStyles((theme) => ({
  cards: {
    width: "100%",
    margin: 10,
    padding: 10,
  },
  magnetInput: {
    width: "85ch",
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
  const [started, setStarted] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);

  const [files, setFiles] = useState([]);
  const updateFile = (file) => {
    console.log(file);
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

    socket.on("acknowledge", (data) => setAcknowledged(data.acknowledged));
    socket.on("fileUpdate", updateFile);
    socket.on("files", setFiles);
    socket.on("downloadLink", (data) => {
      setDownloadLink(data.identifier);
      setStarted(false);
    });
    
  }, [socket]);

  const handleDownloadTorrent = () => {
    console.log("Emitting torrent download request");

    setAcknowledged(false);
    setDownloadLink(null);
    setFiles([]);

    socket.emit("start", { torrentMagnet: torrentMagnet });
    setStarted(true);
  };

  return (
    <Grid
      container
      direction="column"
      justify="center"
      alignItems="center"
      className={classes.root}
    >
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <div>
          <h1> Anon - Tor </h1>
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
            variant="contained" 
            onClick={handleDownloadTorrent}
            color="primary"
            disabled={started}
          >
            Start
          </Button>
        </Card>
      </div>

      {downloadLink != null ? (
        <Alert severity="success">
          <a href={"http://localhost:3001/download?sid=" + downloadLink}>
            Your download is ready!
          </a>
        </Alert>
      ) : (
        ""
      )}

      <div>
        {started && acknowledged && files.length > 0 ? (
          files.map((file, index) => (
            <Card key={index.toString()} className={classes.cards}>
              <pre>{file.name}</pre>

              <pre>
                {file.downloaded} bytes / {file.length} bytes
              </pre>

              <LinearProgress variant="determinate" value={file.progress} />
            </Card>
          ))
        ) : started ? (
          <CircularProgress />
        ) : (
          ""
        )}
      </div>
    </Grid>
  );
}

export default App;
