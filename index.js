var csvparse = require('csv-parse');
var through = require('through');
var combine = require('stream-combiner');
var moment = require('moment');

exports = module.exports = makeV900Stream;

var csv = csvparse({
	delimiter: ',',
	columns: true
});

var fixNullBytes = through(function (chunk) {
	chunk = chunk.toString('utf8').replace(/\u0000/g, '').trim();
	this.queue(chunk);
});

var mapColumns = through(function (chunk) {
	var obj = {
		index: parseInt(chunk['INDEX']),
		tag: String(chunk['TAG']),
		date: String(chunk['DATE']),
		time: String(chunk['TIME']),
		latitude: String(chunk['LATITUDE N/S']),
		longitude: String(chunk['LONGITUDE E/W']),
		altitude: Number(chunk['HEIGHT']),
		speed: Number(chunk['SPEED']),
		heading: Number(chunk['HEADING']),
		vox: Number(chunk['VOX'])
	};

	this.queue(obj);
});

var fixCoords = through(function (chunk) {
	var latParts = /^(.+)(N|S)$/.exec(chunk.latitude);
	var ns = latParts[2];
	var latitude = Number(latParts[1]);
	if (ns === 'S') { latitude *= -1; }
	chunk.latitude = latitude;

	var lonParts = /^(.+)(E|W)$/.exec(chunk.longitude);
	var ew = lonParts[2];
	var longitude = Number(lonParts[1]);
	if (ew === 'W') { longitude *= -1; }
	chunk.longitude = longitude;

	this.queue(chunk);
});

var fixTime = through(function (chunk) {
	var dateParts = /(\d\d)(\d\d)(\d\d)/.exec(chunk.date);
	var year = 2000 + Number(dateParts[1]);
	var month = dateParts[2];
	var day = dateParts[3];

	var timeParts = /(\d\d)(\d\d)(\d\d)/.exec(chunk.time);
	var hour = timeParts[1];
	var minute = timeParts[2];
	var second = timeParts[3];

	var isoString = year + '-' + month + '-' + day + 'T' + hour + ':' + minute + ':' + second;
	chunk.isoTime = isoString;

	var time = moment.utc(isoString, 'YYYY-MM-DDTHH:mm:ss');
	chunk.time = +time;

	delete chunk.date;

	this.queue(chunk);
});

function makeV900Stream () {
	return combine(
		fixNullBytes,
		csv,
		mapColumns,
		fixCoords,
		fixTime
	);
}
