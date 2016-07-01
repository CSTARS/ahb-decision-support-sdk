var request = require('superagent');
var config = require('../config');
var utils = require('./utils');
var extend = require('extend');
var async = require('async');

var count = 1;
var query = {
  view : 'pointToWeather(-121.9921875,39.02771884021161,8192)',
  tq : 'SELECT *',
  tqx : 'reqId:'
};

module.exports = {
    getAll : getAll
};

function getAll(query, callback) {

  request
    .post(config().ahbServer+config().ahbBulkWeatherUrl)
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

      callback(null, resp.coordinates);
    });
}
