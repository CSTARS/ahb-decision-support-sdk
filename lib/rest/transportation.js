/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var utils = require('./utils');

var cache = {};

module.exports = function(r) {
  request = r;

  return {
    get : get,
    getAll : getAll
  };
};

function get(start, stop, callback) {
  var id = start.join('-')+'-'+stop.join('-');

  if( cache[id] ) {
    return callback(null, cache[id], true);
  }

  // for now..
  fake(id, start, stop, callback);
}

function getAll(sources, destination, socketId, callback) {

  sources = sources.map(function(latlng){
    return {
      type : 'Feature',
      geometry : {
        type : 'Point',
        coordinates : [latlng[1], latlng[0]]
      },
      properties : {
        id : latlng.join(',')+':'+destination.join(',')
      }
    };
  });


  destination = {
    type : 'Feature',
    geometry : {
      type : 'Point',
      coordinates : [destination[1], destination[0]]
    },
    properties : {
      id : destination.join(',')
    }
  };

  request
    .post('/transportation/getRoutes')
    .send({
      sources : {
        type : 'FeatureCollection',
        features : sources
      },
      destination : destination,
      options : {
        socketId : socketId
      }
    })
    .end(function(err, resp){
      if( err ) {
        console.log(err);
        console.log(resp);
      }

      callback(err, resp);
    });
}


function fake(id, start, stop, callback) {
  var transportation = {
    type: 'Feature',
    properties: {
      distance : getDistance(start, stop)
    },
    geometry: {
      type: 'LineString',
      coordinates : [
        [start[1], start[0]],
        [stop[1], stop[0]],
      ]
    }
  };

  cache[id] = transportation;

  var resp = {
    cached : false,
    id : id,
    transportation : transportation
  };

  if( callback ) callback(null, resp, false);
  return resp;
}

function getDistance(start, stop) {
  // to xy meters
  start = utils.llToMeters(start[0], start[1]);
  stop = utils.llToMeters(stop[0], stop[1]);

  return Math.sqrt(Math.pow(start[1] - stop[1], 2) +  Math.pow(start[0] - stop[0], 2));
}
