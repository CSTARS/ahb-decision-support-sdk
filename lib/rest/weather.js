var request;

var config = require('../config');
var utils = require('./utils');
var extend = require('extend');
var async = require('async');

var cache = {};
var count = 1;
var query = {
  view : 'pointToWeather(-121.9921875,39.02771884021161,8192)',
  tq : 'SELECT *',
  tqx : 'reqId:'
};

module.exports = function(r) {
  request = r;

  return {
    get : get,
    getAll : getAll
  };
};

function getAll(xys, callback) {
  var query = [];
  var lookup = [];

  for( var i = 0; i < xys.length; i++ ) {
    var afriPx = utils.toAfriPx(xys[i][0], xys[i][1]).join('-');
    var index = lookup.indexOf(afriPx);

    if( index === -1 ) {
      query.push(xys[i].join(','));
      lookup.push(afriPx);
      index = lookup.length - 1;
    }

    xys[i] = index;
  }

  request
    .post(config().ahbBulkWeatherUrl)
    .send({coordinates: query})
    .end(function(err, resp){
      if( err ) {
        return callback(err);
      }

      resp = resp.body;

      // set nrel
      resp.coordinates.forEach(function(location){
        location.forEach(function(item) {
          item.nrel = item.rad / 0.0036;
        });
      });

      for( var i = 0; i < xys.length; i++ ) {
        xys[i] = extend(true, [], resp.coordinates[xys[i]]);
      }

      callback(null, xys);
    });
}


function get(lat, lng, callback) {
  var afriPx = utils.toAfriPx(lng, lat).join('-');

  if( cache[afriPx] ) {
    return callback(null, cache[afriPx], true);
  }

  var q = extend(true, {}, query);
  var p = [lng, lat, 8192];
  q.view = 'pointToWeather('+p.join(',')+')';
  q.tqx += count;
  count++;

  request
    .get(config().ahbWeatherUrl)
    .query(q)
    .end(function(err, resp){
      if( err ) {
        return callback(err, null, false);
      }
      resp = utils.vizSourceToTable(resp.text);
      if( resp.error ) {
        return callback(err, null, false);
      }

      // set nrel
      resp.forEach(function(item){
        item.nrel = item.rad / 0.0036;
      });

      cache[afriPx] = resp;
      callback(null, resp, false);
    });
}
