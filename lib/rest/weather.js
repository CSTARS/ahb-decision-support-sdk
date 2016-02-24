var request;

var config = require('../config');
var utils = require('./utils');
var extend = require('extend');

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
    get : get
  };
};

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
