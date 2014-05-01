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

var server = http.createServer(requesthandler).listen(5000,function() { console.log('listening'); })
  , primus = new Primus(server, { transformer: 'engine.io' });


var lastimage
  , currentimage
  , takepic = function() {
  var child = exec('fswebcam -d /dev/video0 -r 640x480 --rotate -90 --jpeg 35 -q -', {encoding: 'base64'}, function(err, stdout, stderr) {
    if (!err && !stderr) {
      primus.write({action: 'updatepic', data: stdout});
      currentimage = Date.now() + '.jpg';
      fs.writeFile(__dirname + '/pics/' + currentimage, new Buffer(stdout, 'base64'), function(err) {
        if (err) console.error(err);
        var compare = exec(
          'compare -quiet ' + currentimage + ' ' + lastimage + ' -',
          {
            cwd: __dirname + '/pics',
            encoding: 'base64'
          },
          function(err, stdout, stderr) {
            if (!err && !stderr) {
              primus.write({action: 'updatedif', data: stdout});
            } else {
              console.error(new Buffer(stderr, 'base64').toString());
            }
          }
        );
        lastimage = currentimage;
        takepic();
      });
    } else {
      if (err) console.error(err);
      console.error(new Buffer(stderr, 'base64').toString());
      takepic();
    }
  });
}

takepic();
