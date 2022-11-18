// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx = {};  // namespace

require("./session-server/WSServer");
require("./session-server/WSClient");
require("./session-server/Session");
require("./session-server/SessionManager");

const express =     require("express");
const proxy =       require("./proxy-downloader/ProxyDownloader");
const keepalive =   require("./keepalive/KeepAlive");

const port =        process.env.PORT || 8081;

// Proxy Downloader and KeepAlive

const app = express();
app.get('/proxy-remote-download', proxy.processGet);
app.get('/keepalive', keepalive.processGet);

// Server

const httpServer = app.listen(port, function() {
    console.log('Proxy and Signaling server started on port', port);
});

// Session Manager

const wss = new wmsx.WSSever();
wss.start(httpServer);

new wmsx.SessionManager(wss);
