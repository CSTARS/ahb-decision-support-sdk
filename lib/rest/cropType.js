/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/

var md5 = require('md5');

var cache = {};

module.exports = function(r) {
  request = r;

  return {
    get : get,
    getAll : getAll
  };
};

function get(geojson, callback) {
  var id = md5(JSON.stringify(geojson.geometry));

  if( cache[id] ) {
    callback(null, cache[id], true);
  }

  // for now..
  fake(id, geojson, callback);
}

function getAll(geojsonArray, callback) {

  var resp = [];

  for( var i = geojsonArray.length-1; i >= 0; i-- ) {
    var id = md5(JSON.stringify(geojsonArray[i].geometry));

    if( cache[id] ) {
      var geojson = geojsonArray.splice(i, 1)[0];
      resp.push({
        cached : true,
        crop : cache[id],
        geojson : geojson
      });
    }
  }


  for( var i = 0; i < geojsonArray.length; i++ ) {
    resp.push(fake(id, geojsonArray));
  }

  callback(null, resp)
}


function fake(id, geojson, callback) {
  var crop = '';
  if( Math.random() < 0.5 ) {
    crop = 'barley';
  } else {
    crop = 'alfalfa';
  }

  cacha[id] = crop;

  var resp = {
    cached : false,
    geojson : geojson,
    crop : crop
  };

  if( callback ) callback(null, resp, false);
  return resp;
}
