var csvparse = require('csv-parse');
var through = require('through');
var combine = require('stream-combiner');
var moment = require('moment');

exports = module.exports = makeV900Stream;

function makeV900Stream () {

	var csv = csvparse({
		delimiter: ',',
		columns: null
	});

	var fixNullBytes = through(function (chunk) {
		chunk = chunk.toString('utf8').replace(/\u0000/g, '').trim();
		this.queue(chunk);
	});

	var mapColumns = through(function (chunk) {
		if (chunk[0] === 'INDEX') { return; }
		if (!chunk.length) { return; }

		var obj = {};
		var v900Fields = { index: 'int', tag: 'string', date: 'string', time: 'string',
		                   latitude: 'string', longitude: 'string', altitude: 'number',
		                   speed: 'number', heading: 'number', vox: 'number' };

		var v990Fields = { index: 'int', tag: 'string', date: 'string', time: 'string',
		                   latitude: 'string', longitude: 'string', altitude: 'number',
		                   speed: 'number', heading: 'number', fixMode: 'string', 
		                   valid: 'string', pdop: 'number', hdop: 'number', vdop: 'number',
		                   vox: 'number' };

		Object.keys(v990Fields).forEach(function (fieldName) {
			obj[fieldName] = null;
		});

		var fields;

		if (chunk.length === Object.keys(v900Fields).length) {
			fields = v900Fields;
		} else if (chunk.length === Object.keys(v990Fields).length) {
			fields = v990Fields;
		}

		if (!fields) { return; }

		Object.keys(fields).forEach(function (fieldName, index) {
			var value = chunk[index];
			var type = fields[fieldName];

			switch (type) {
				case 'int':
					value = parseInt(value, 10);
					break;

				case 'number':
					value = Number(value);
					break;

				case 'string':
					value = String(value);
					break;
			}

			obj[fieldName] = value;
		});

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

	return combine(
		fixNullBytes,
		csv,
		mapColumns,
		fixCoords,
		fixTime
	);
}
