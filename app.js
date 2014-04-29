'use strict';

var exec = require('child_process').exec
  , fs = require('fs')
  , http = require('http')
  , Primus = require('primus')
  , jade = require('jade');

var indexhtml = jade.renderFile(__dirname + '/index.jade');

var requesthandler = function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(indexhtml);
  res.end();
};

var server = http.createServer(requesthandler).listen(5000,function() { console.log('Listening on 5000'); })
  , primus = new Primus(server, { transformer: 'engine.io' });

var takepic = function() {
  var child = exec('fswebcam -d /dev/video0 -r 640x480 --rotate -90 --jpeg 35 -q -', {encoding: null}, function(err, stdout, stderr) {
    if (!err && !stderr) {
      primus.write(stdout.toString('base64'));
      return 0;
    }

    if (err) console.log(err);
    if (stderr) console.error(stderr);
  });
};

setInterval(function() { takepic(); }, 2000);
