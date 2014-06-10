var path = require('path');
var fs = require('fs');
var level = require('level');
var sublevel = require('level-sublevel');
var through = require('through');
var v900 = require('./index');

var db = sublevel(level('roadtrip.db'), { valueEncoding: 'json' });
var logDB = db.sublevel('log');


var print = through(function (chunk) {
	console.log(chunk);
	this.push(chunk);
});

var log = through(function (chunk) {
	var key = logKey(chunk);

	logDB.put(key, chunk, function () {
		this.push(chunk);
	}.bind(this));
});

var dist = (function () {
	var distance = 0;

	return through(function (chunk) {
		distance += chunk.distance;
		this.push(chunk);
	}, function () {
		console.log('D', distance + 'km');
	});
})();

var fileStream = fs.createReadStream('./rt2012/12090500.CSV');

fileStream
	.pipe(v900())
	.pipe(log)
	.pipe(dist)
	.pipe(print);

function logKey (entry) {
	return entry.tag + ':' + padLeft(entry.time, '0', 16);
}

function padLeft (str, ch, len) {
	return (str.length >= len) ? str : padLeft(ch + str, ch, len);
}
