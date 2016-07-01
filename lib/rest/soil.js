var request = require('superagent');
var config = require('../config');
var utils = require('./utils');
var extend = require('extend');

var count = 1;
var query = {
  view : 'pointToSOIL(-121.9921875,39.02771884021161,8192)',
  tq : 'SELECT *',
  tqx : 'reqId:'
};

module.exports = {
    getAll : getAll
};

function getAll(query, callback) {

  request
    .post(config().ahbServer+config().ahbBulkSoilUrl)
    .send({coordinates: query})
    .end(function(err, resp){
      if( err ) {
        return callback(err);
      }

      resp = resp.body;

      // HACK
      resp.coordinates.forEach(function(item){
        item.maxAWS = item.maxaws;
        delete item.maxaws;
      
        for( var key in item ) {
          item[key] = parseFloat(item[key]);
        }
      });

      callback(null, resp.coordinates);
    });
}