'use strict';

var spawn = require('child_process').spawn
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

var server = http.createServer(requesthandler).listen(5000)
  , primus = new Primus(server, { transformer: 'engine.io' });

var findendofjpg = function(buffer) {
  var i;
  for (i=0; i<buffer.length; i++) {
    if (buffer[i] === 255)
      if (buffer[i+1] === 217)
        return i+1;
  };
  return 0;
};

var picdata = [];
var child = spawn('fswebcam', ['-d', '/dev/video0', '-r', '640x480', '--rotate', '-90', '--jpeg', '35', '-q', '--no-banner', '-l', '1', '-']);

child.stdout.on('data', function(data) {
  var end
    , pic;
  if (end = findendofjpg(data)) {
    picdata.push(data.slice(0,end));
    pic = Buffer.concat(picdata);
    primus.write(pic.toString('base64'));
    fs.writeFile(__dirname + '/pics/' + Date.now() + '.jpg', pic, function(err) {
      if (err) console.log('write error - ' + err);
    });
    picdata = [ data.slice(end+1) ];
  } else {
    picdata.push(data);
  }
});

child.stderr.on('data', function(data) {
  console.error(data.toString());
});

child.on('close', function(code) {
  console.log('child process exited with code ' + code);
});

