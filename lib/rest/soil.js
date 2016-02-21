var request;

var config = require('../config');
var utils = require('./utils');
var extend = require('extend');

var count = 1;
var query = {
  view : 'pointToSOIL(-121.9921875,39.02771884021161,8192)',
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
  var q = extend(true, {}, query);
  var p = [lat, lng, 8192];
  q.view = 'pointToSOIL('+p.join(',')+')';
  q.tqx += count;
  count++;

  request
    .get(config().ahbWeatherUrl)
    .query(q)
    .end(function(err, resp){
      if( err ) {
        return callback(err);
      }
      resp = utils.vizSourceToTable(resp.text);
      if( resp.error ) {
        return callback(err);
      }

      // crap
      var item = resp[0];
      item.maxAWS = item.maxaws;
      delete item.maxaws;

      callback(null, item);
    });
}
