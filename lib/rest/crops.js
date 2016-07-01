var extend = require('extend');
var request = require('superagent');
var config = require('../config')();
/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/


module.exports = {
    getAll : getAll,
    getPriceAndYield : getPriceAndYield
};

function getAll(geojsonArray, callback) {

  var resp = [];

  geojsonArray = geojsonArray.map(function(geojson){
    return {
      type : geojson.geometry.type,
      coordinates : geojson.geometry.coordinates
    };
  });

  request
    .post(config.ahbServer+'/crops/get')
    .send({
      geometries : {
        type : 'GeometryCollection',
        geometries : geojsonArray
      }
    })
    .end(function(err, resp){
      if( err ) {
        console.log(err);
        console.log(resp);
      }

      callback(err, resp.body);
    });
}

function getPriceAndYield(query, callback) {
  request
    .post(config.ahbServer+'/crops/priceAndYield')
    .send(query)
    .end(function(err, resp){
      callback(err, resp.body);
    });
}
