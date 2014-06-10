'use strict';

var exec = require('child_process').exec
  , fs = require('fs')
  , http = require('http')
  , Primus = require('primus')
  , jade = require('jade');

var indexhtml = jade.renderFile(__dirname + '/views/index.jade');

var requesthandler = function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(indexhtml);
  res.end();
};

var server = http.createServer(requesthandler).listen(5000,function() { console.log('listening'); })
  , primus = new Primus(server, { transformer: 'engine.io' });


var lastimage
  , currentimage
  , motion
  , motionpath = ''
  , getnum = /^([0-9.]+)/
  , takepic = function() {
  var child = exec('fswebcam -r 640x480 --jpeg 75 -q -',{encoding: 'base64'}, function(err, stdout, stderr) {
    if (!err && !stderr) {
      primus.write(stdout);
      currentimage = Date.now() + '.jpg';
      if (motion) {
        motion--;
        console.log('motion: ' + motion);
        motionpath = 'motion/';
      } else {
        motionpath = '';
      }
      fs.writeFile(__dirname + '/pics/' + motionpath + currentimage, new Buffer(stdout, 'base64'), function(err) {
        if (err) console.error(err);
        if (!motion) {
          var compare = exec(
            'compare -metric mae ' + currentimage + ' ' + lastimage + ' /dev/null',
            { cwd: __dirname + '/pics' },
            function(err, stdout, stderr) {
              var result = getnum.exec(stderr);
              if (result) {
                var diff = parseFloat(result[0]);
                if (diff > 900) {
                  motion = 30;
                }
              }
              console.log(diff);
              process.nextTick(takepic);
            }
          );
        } else {
          process.nextTick(takepic);
        }
        lastimage = currentimage;
      });
    } else {
      if (err) console.error(err);
      console.error(new Buffer(stderr, 'base64').toString());
      process.nextTick(takepic);
    }
  });
}

process.nextTick(takepic);
