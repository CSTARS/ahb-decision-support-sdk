/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/

var md5 = require('md5');
var extend = require('extend');
var cache = {};

var data = [
  {
    name : 'alfalfa',
    yield : 8,
    price : 180.00,
    units : 'Mg'
  },
  {
    name : 'barley',
    yield : 50,
    price : 6,
    units : 'BU'
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
        crop : cache[item.id],
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
  var item = extend(true, {}, data[Math.floor(Math.random()*2)]);


  var randOffset = item.price * Math.random() * 0.2;
  item.price = randOffset + item.price;

  randOffset = item.yield * Math.random() * 0.2;
  item.yield = randOffset + item.yield;

  cache[id] = item;

  var resp = {
    cached : false,
    geojson : geojson,
    crop : item
  };

  if( callback ) callback(null, resp, false);
  return resp;
}
