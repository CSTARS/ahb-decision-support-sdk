var extend = require('extend');

/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var request;

module.exports = function(r) {
  request = r;

  return {
    getAll : getAll
  };
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

      callback(err, resp.body, geojsonArray);
    });
}
