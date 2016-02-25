/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/

var md5 = require('md5');
var cache = {};

var data = [
  {
    crop : 'alfalfa',
    yield : 16
  },
  {
    crop : 'barley',
    yield : 15
  }
];

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
    return callback(null, cache[id], true);
  }

  // for now..
  fake(id, geojson, callback);
}

function getAll(geojsonArray, callback) {

  var resp = [];

  geojsonArray = geojsonArray.map(function(geojson){
    return {
      geojson : geojson,
      id : md5(JSON.stringify(geojson.geometry))
    };
  });

  var i, item;
  for( i = geojsonArray.length-1; i >= 0; i-- ) {
    item = geojsonArray[i];
    if( cache[item.id] ) {
      geojsonArray.splice(i, 1);

      resp.push({
        cached : true,
        crop : cache[item.id].crop,
        yeild : cache[item.id].yeild,
        geojson : item.geojson
      });
    }
  }

  geojsonArray.forEach(function(item){
    resp.push(fake(item.id, item.geojson));
  });

  callback(null, resp);
}


function fake(id, geojson, callback) {
  var item = data[Math.floor(Math.random()*2)];

  cache[id] = item;

  var resp = {
    cached : false,
    geojson : geojson,
    crop : item.crop,
    yield : item.yield
  };

  if( callback ) callback(null, resp, false);
  return resp;
}
