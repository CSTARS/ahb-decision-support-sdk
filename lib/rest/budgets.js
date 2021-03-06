/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var async = require('async');
var request = require('superagent');

var model = require('../models/budget');

/*
 Water data, stubbed for now.
*/

var api = {
    get : get,
    find : find,
    getAll : getAll
};
model.injectQuery(api);

module.exports = api;

function getAll(collection, callback) {
  var data = {};

  async.eachSeries(
    collection.budgetIds,
    function(id, next){
      var parts = id.split('-');
      var fips = parts[0];
      var state = parts[2];
      var crop = parts[1];


      get(crop, fips, state, function(resp){
        data[id] = resp;
        next();
      });
    },
    () => {
      callback(data);
    }
  );
}

function get(crop, fips, state, callback) {
  crop = crop.toLowerCase();
  state = state.toLowerCase();

  var q = {
    query : {
      // $text: {
      //   $search :'swap'
      // },
      authority : 'AHB',
      commodity : crop,
      locality : fips
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };

  model.getSDK().budgets.search(q, function(resp){
    if( resp.total === 0 ) {
      console.warn('WARNING: unable to find budget for '+crop+' in '+fips+' trying '+state);
      return tryState(crop, fips, state, callback);
    }

    model.getSDK().loadBudget(resp.results[0].id, function(budget){
      var b = model.getSDK().getTotal();

      callback({
        id : resp.results[0].id,
        budget : b
      });
    });
  });
}

function tryState(crop, fips, state, callback) {
  var q = {
    query : {
      authority : 'AHB',
      commodity : crop,
      locality : state
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };

  model.getSDK().budgets.search(q, function(resp){
    if( resp.total === 0 ) {
      var err = {
        error: true,
        message: 'Unable to find budget for '+crop+' in '+fips
      };
      console.error('Unable to find budget for '+crop+' in '+fips+' or '+state);
      return callback({
        id : '',
        budget : 0
      });
    }

    model.getSDK().loadBudget(resp.results[0].id, function(budget){
      var b = model.getSDK().getTotal();

      callback({
        id : resp.results[0].id,
        budget : b
      });
    });
  });


}

function find(crop, callback) {
  crop = crop.toLowerCase();

  var q = {
    query : {
      authority : 'AHB',
      commodity : crop
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };

  model.getSDK().budgets.search(q, function(resp){
    if( resp.total === 0 ) {
      return callback({
        error: true,
        message: 'Unable to find budget for '+crop+' in '+state
      });
    }

    callback(resp.results);
  });
}
