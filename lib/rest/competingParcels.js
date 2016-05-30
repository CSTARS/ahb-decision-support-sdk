var async = require('async');
var parcels = require('./parcels')();
var crops = require('./crops')();
var parcelLib = require('../parcels');

var GRID_SIZE = 4;
var validParcels = [];
var ee, count;

function getGrid(lat, lng, radius, callback) {
  
  
  if( radius < 50000 ) {
    GRID_SIZE = 3;
  } else if( radius < 100000 ) {
    GRID_SIZE = 4;
  } else if( radius < 150000 ) {
    GRID_SIZE = 5;
  } else if( radius < 200000 ) {
    GRID_SIZE = 6;
  } else {
    GRID_SIZE = 7;
  }
  console.log(GRID_SIZE);
  
  var topLeft = buffer(lat, lng, radius);
  var bottomRight = buffer(lat, lng, -1 * radius);
  
  var width = Math.abs(topLeft[1] - bottomRight[1]) / GRID_SIZE;
  var height = Math.abs(topLeft[0] - bottomRight[0]) / GRID_SIZE;
  
  var queries = [];
  var left, top, bottom, right;
  
  for( var i = 0; i < GRID_SIZE; i++ ) {
    top = topLeft[0] - (height * i);
    bottom = topLeft[0] - (height * (i+1));
    
    for( var j = 0; j < GRID_SIZE; j++ ) {
      left = topLeft[1] - (width * j);
      right = topLeft[1] - (width * (j+1));
      queries.push([[top, left], [bottom, right]]);
    }
  }
  
  return queries;
}

function run(lat, lng, radius, callback, events) {
  var queries = getGrid(lat, lng, radius);
  ee = events;
  validParcels = [];
  count = 0;
  
  async.eachSeries(queries, getParcels, () => {
    callback(validParcels);
  });
  
  return queries;
}


function getParcels(query, next) {

  parcels.request(query[0], query[1], (err, features) => {
    if( err ) {
      console.log(err);
      return next();
    }
    
    count++;
    var i = count / (GRID_SIZE * GRID_SIZE * 2);
    ee.emit('parcels-update-updated', {percent: Math.floor(i*100)});
    
    crops.getAll(features, (err, resp) => {
      if( err ) {
        console.log(err);
        return next();
      }
      
      process(features, resp);
      
      count++;
      var i = count / (GRID_SIZE * GRID_SIZE * 2);
      ee.emit('parcels-update-updated', {percent: Math.floor(i*100)});
      
      next();
    });
  });
}

function process(features, cropTypes) {
  var lookup = {}, i, p;
  var valid = [];
  
  for( i = 0; i < cropTypes.length; i++ ) {
    lookup[cropTypes[i].id] = cropTypes[i];
  }
  
  for( i = 0; i < features.length; i++ ) {
    var p = parcelLib.process(features[i], lookup);
    if( p ) {
      validParcels.push(p);
    }
  }
}


// Position, decimal degree
// http://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
function buffer(lat, lng, radius) {
   //Earth’s radius, sphere
   var R = 6378137;

   //offsets in meters
   var dn = radius;
   var de = radius;

   //Coordinate offsets in radians
   var dLat = dn / R;
   var dLon = de / (R * Math.cos(Math.PI * lat / 180));

   //OffsetPosition, decimal degrees
   return [lat + dLat * 180 / Math.PI, lng + dLon * 180 / Math.PI];
}

module.exports = run;