var async = require('async');
var parcels = require('./parcels');
var crops = require('./crops');
var geometryUtils = require('../geometry/utils');
var collection;
var controller = require('../controllers/parcels');
var events = require('../events');

var GRID_SIZE = 4;
var includedParcels = {};
var count, doubleCount;

function getGrid(lat, lng, radius, callback, gridsize) {
  
  if( !gridsize ) {
    if( radius < 25000 ) {
      GRID_SIZE = 1;
    } if( radius < 50000 ) {
      GRID_SIZE = 2;
    } else if( radius < 100000 ) {
      GRID_SIZE = 3;
    } else if( radius < 150000 ) {
      GRID_SIZE = 4;
    } else if( radius < 175000 ) {
      GRID_SIZE = 5;
    } else if( radius < 200000 ) {
      GRID_SIZE = 6;
    } else if( radius < 250000 ) {
      GRID_SIZE = 7;
    } else if( radius < 300000 ) {
      GRID_SIZE = 8;
    } else if( radius < 350000 ) {
      GRID_SIZE = 10;
    } else if( radius < 400000 ) {
      GRID_SIZE = 12;
    } else {
      GRID_SIZE = 15;
    }
  } else {
    GRID_SIZE = gridsize;
  }
  
  var topLeft = geometryUtils.buffer(lat, lng, radius);
  var bottomRight = geometryUtils.buffer(lat, lng, -1 * radius);
  
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

function run(lat, lng, radius, parcelCollection, callback) {
  collection = parcelCollection;
  var queries = getGrid(lat, lng, radius);
  count = 0;
  doubleCount = 0;
  includedParcels = {};
  collection.validCount = 0;
  
  async.eachSeries(queries, getParcels, () => {
    includedParcels = {};
    callback();
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
    events.emit('parcels-update-updated', {percent: Math.floor(i*100)});
    
    /**
     * remove duplicates, parcels that overlap more than one grid
     */
    for( i = features.length-1; i >= 0; i-- ) {
      if( includedParcels[features[i].properties.PolyID] ) {
        features.splice(i, 1);
        doubleCount++;
      } else {
        includedParcels[features[i].properties.PolyID] = 1;
      }
    }
    
    crops.getAll(features, (err, resp) => {
      if( err ) {
        console.log(err);
        return next();
      }
      
      process(features, resp, () => {
        count++;
        var i = count / (GRID_SIZE * GRID_SIZE * 2);
        events.emit('parcels-update-updated', {percent: Math.floor(i*100)});
        
        next();
      });
    });
  });
}

function process(features, cropTypes, callback) {
  var lookup = {}, i, p;

  for( i = 0; i < cropTypes.length; i++ ) {
    lookup[cropTypes[i].id] = cropTypes[i];
  }

  async.eachSeries(
    features,
    (parcel, next) => {
      var p = controller.initNewParcel(parcel, lookup);

      if( p ) {
        collection.add(p, next);
      } else {
        next();
      }
    },
    (err) => {
      callback();
    }
  );
}




module.exports = run;