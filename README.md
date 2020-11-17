## Anon-Tor
Simple torrent download app built with node and react. 
This project is intended to be hosted on a server in order to provide the option to use a remote environment to download torrents. 
This application could readily be adapted as an online service for users who would rather not or can not download a torrent.

### Technologies
* Express JS
* Node JS 
* Socket-Io
* Torrent-Stream

### Overview
* Has a user interface to input a magnet link
* User interface will keep you up to date on the download progress
* Files are stored in ./backend/downloads

### Improvements / Stretch Goals
* After all files downloaded, zip the files and serve a downloadable link

## Demos

### Interface
![Interface Demo](https://github.com/chasekov/anon-tor/blob/master/docs/interface.PNG)

### Proof of Download 
![Login Demo](https://github.com/chasekov/anon-tor/blob/master/docs/download_folder.PNG)


## How To Use

1. Pull the repository
2. Set up environment file for react-secure-api directory, example file contents for "./backend/.env" below
```
SERVER_PORT=3001
CLIENT_ORIGIN=http://localhost:3000
```
3. Start backend
```
cd ./backend
npm start
```
5. Start frontend
```
cd ./frontend
npm start
```
