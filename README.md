v900-convert
============

Transforms a Columbus V900 or V990 GPS CSV stream to an object stream and fixes the values.

### Installation

```bash
npm install v900-convert --save
```

###Example

```javascript
var fs = require('fs');
var through = require('through');
var v900 = require('v900-convert');

var print = through(function (chunk) {
  console.log(chunk);
  this.push(chunk);
});

var fileStream = fs.createReadStream('v900-12090500.CSV');

fileStream
  .pipe(v900())
  .pipe(print);
```

```javascript
...
{ index: 11382,
  tag: 'T',
  time: 1346837273000,
  latitude: 45.791098,
  longitude: 11.017924,
  altitude: 199,
  speed: 17,
  heading: 179,
  vox: 0,
  isoTime: '2012-09-05T09:27:53' }
...
```


### License

MIT License  
Copyright (c) 2014 Max Kueng