// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

module.exports = {
    processGet: processGet
};

function processGet(req, res) {

    console.log(">>> KeepAlive received");
    res.sendStatus(200);

}