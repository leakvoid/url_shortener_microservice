
var express = require('express');

var app = express();
var port = process.env.PORT || 3000;

app.get('/', function(req, res) {
    console.log('url microshortener test');
    res.end('url microshortener test');
});

app.listen(port, function() {
    console.log('App started on port: ' + port);
});
