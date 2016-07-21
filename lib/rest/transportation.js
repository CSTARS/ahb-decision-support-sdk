/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var io = require('socket.io-client');
var request = require('superagent');
var utils = require('./utils');
var events = require('../events');

module.exports = {
  getAll : getAll
};

function getAll(sources, destination, routeGeometry, callback) {
  // TODO: switch this to provided parameter
  var socket = io.connect('http://'+window.location.host);
  socket.on('connect', function(){
    _getAll(sources, destination, socket, routeGeometry);
  });
  
  socket.on('transportation-update', (data) => {
    events.emit('transportation-update', data);
  });

  socket.on('routes-calculated', function(data) {
    data.paths = JSON.parse(data.paths);
    data.network = JSON.parse(data.network);
    
    callback(null, data);
    events.emit('routes-calculated', data);
    socket.disconnect();
  });
  
  return socket;
}

function _getAll(sources, destination, socket, routeGeometry, callback) {

  sources = sources.map(function(latlng){
    return {
      type : 'Feature',
      geometry : {
        type : 'Point',
        coordinates : [latlng[1], latlng[0]]
      },
      properties : {
        id : latlng[2]
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
