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

function getAll(starting, stop, callback) {

  var resp = [];

  starting = starting.map(function(start){
    return {
      start : start,
      id : start.join('-')+'-'+stop.join('-')
    };
  });

  var i, item;
  for( i = starting.length-1; i >= 0; i-- ) {
    item = starting[i];
    if( cache[item.id] ) {
      starting.splice(i, 1);

      resp.push({
        cached : true,
        transportation : cache[item.id]
      });
    }
  }

  starting.forEach(function(item){
    resp.push(fake(item.id, item.start, stop));
  });

  callback(null, resp);
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
        start,
        stop
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
