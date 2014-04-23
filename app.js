var exec = require('child_process').exec
  , fs = require('fs')
  , express = require('express');

var takepic = function() {
  var child = exec('fswebcam -d /dev/video0 -r 640x480 --rotate -90 --jpeg 35 -q '+Date.now()+'.jpg', { cwd: __dirname + '/pics' }, function(err,stdout,stderr) {
    if (err) console.log(err);
  });
};

setInterval(takepic, 2000);

// watch for changes
var latestfilename;
fs.watch(__dirname + '/pics', function(event, filename) {
  latestfilename = filename;
});

// webserver
var app = express();

app.get('/latestpic', function(req, res) {
  res.send(latestfilename);
});

app.use(express.static(__dirname + '/pics'));

app.listen(8080);
