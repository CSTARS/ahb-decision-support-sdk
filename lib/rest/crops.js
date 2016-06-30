var extend = require('extend');
var request = require('superagent');
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
    .post('/crops/get')
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
    .post('/crops/priceAndYield')
    .send(query)
    .end(function(err, resp){
      callback(err, resp.body);
    });
}
