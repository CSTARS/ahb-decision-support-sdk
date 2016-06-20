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
    getAll : getAll
  };
};

function getAll(query, callback) {


  request
    .post(config().ahbBulkSoilUrl)
    .send({coordinates: query})
    .end(function(err, resp){
      if( err ) {
        return callback(err);
      }

      resp = resp.body;

      resp.coordinates.forEach(function(item){
        item.maxAWS = item.maxaws;
        delete item.maxaws;
      
        for( var key in item ) {
          item[key] = parseFloat(item[key]);
        }
      });

      //for( var i = 0; i < xys.length; i++ ) {
      //  xys[i] = extend(true, {}, resp.coordinates[xys[i]]);
      //}

      callback(null, resp.coordinates);
    });
}

function get(lat, lng, callback) {
  var afriPx = utils.toAfriPx(lng, lat).join('-');

  function onNoCache() {
    var q = extend(true, {}, query);
    var p = [lng, lat, 8192];
    q.view = 'pointToSOIL('+p.join(',')+')';
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

        // crap
        var item = resp[0];
        item.maxAWS = item.maxaws;
        delete item.maxaws;
        
        for( var key in item ) {
          item[key] = parseFloat(item[key]);
        }

        localdb.add('soil', {
          id : afriPx,
          data : JSON.stringify(item)
        }, function(){
          console.log('soil data cached!')
        }, function(event){
          console.log(event);
        });

        callback(null, item, false);
      });
  }

  localdb.get('soil', afriPx, function(px){
    if( px ) {
      return callback(null, JSON.parse(px.data), true);
    }
    onNoCache();
  }, onNoCache);
}
