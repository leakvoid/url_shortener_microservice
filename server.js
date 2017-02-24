
/* initialization */
var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();

var port = process.env.PORT || 3000;
var db_location = process.env.MONGODB_URI || 'mongodb://localhost:27017/url_shortener_db';

/* utility */

function validate_url(data) {
    console.log('Validating URL: ' + data);
    return require('validator').isURL(data);
}

/* routing */
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/static_pages/about.html');
});

app.get('/favicon.ico', function(req, res) {
    console.log('piss off, favicon!');
    res.end('piss off, favicon!');
});

app.get(/\/full\/(.+)/, function(req, res) {
    var full_url = req.params[0];
    if( validate_url(full_url) === false ) {
	console.log('Invalid URL.');
	res.end('ERROR: format of \"' + full_url + '\" is invalid!');
	return;
    }

    mongo.connect(db_location, function(err, db) {
	if(err) throw err;

	var url_data = db.collection('url_data');
	/* search existing DB entry for full_url */
	url_data.findOne({'full_url': full_url},
			 {'full_url': 1, 'short_url': 1, '_id': 0},
			 function(err, search_result) {
	    if(err) throw err;

	    if(search_result !== null) {
		/* entry found: sending data */
		console.log('Short URL for \"' + full_url + '\" already exists. Sending found data.');
		db.close();

		res.json(search_result);
	    } else {
		/* creating hash for short_url */
		console.log('Creating short URL for new \"' + full_url + '\" address.');
		var url_hash = require('crypto').createHash('sha1').update(full_url).digest('hex').substr(0, 10);
		var short_url = req.protocol + '://' + req.get('host') + '/' + url_hash;

		var new_entry = {'full_url': full_url, 'short_url': short_url};
		console.log('Sending new data.');
		res.json(new_entry);

		url_data.insert(new_entry, function(err, data) {
		    if(err) throw err;

		    console.log('New entry \"' + JSON.stringify(new_entry) + '\" has been added to \"url_data\" collection.');
		    db.close();
		});
	    }
	});
    });
});

app.get('/:url_hash', function(req, res) {
    var short_url = req.protocol + '://' + req.get('host') + '/' + req.params.url_hash;

    mongo.connect(db_location, function(err, db) {
	if(err) throw err;

	var url_data = db.collection('url_data');
	url_data.findOne({'short_url': short_url},
			 {'full_url': 1, '_id': 0},
			 function(err, search_result) {
	    if(search_result === null) {
		console.log('Requested short URL not found.');
		res.end('ERROR: requested URL not found.');
		return;
	    }

	    console.log('Redirecting from short \"' + short_url + '\" to full \"' + search_result.full_url + '\" URL.');
	    res.redirect(search_result.full_url);
	});
    });  
});

app.use(function(req, res) {
    res.end('404!');
});

app.listen(port, function() {
    console.log('App started on port: ' + port);
});
