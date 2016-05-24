/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var io = require('socket.io-client');
var utils = require('./utils');

var cache = {};
var request;

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

function getAll(sources, destination, routeGeometry, callback) {
  // TODO: switch this to provided parameter
  var socket = io.connect('http://'+window.location.host);
  socket.on('connect', function(){
    console.log('Transportation socket connected!');
    _getAll(sources, destination, socket, routeGeometry);
  });
  
  socket.on('routes-calculated', function(data){
    callback(null, data);
    
    socket.disconnect();
  });
  
  return socket;
}

function _getAll(sources, destination, socket, routeGeometry, callback) {
// function getAll(sources, destination, socketId, callback) {

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
        socketId : socket.id,
        routeGeometry : routeGeometry
      }
    })
    .end(function(err, resp){

      if( err ) {
        console.log(err);
        console.log('Disconnecting transportation socket');
        socket.disconnect();
      }
      if( resp.error ) {
        console.log(resp.error);
        console.log('Disconnecting transportation socket');
        socket.disconnect();
      }
    });
}
