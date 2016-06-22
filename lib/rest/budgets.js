/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var async = require('async');
var farmBudgetSdk = require('../budget');

var request, sdk;

/*
 Water data, stubbed for now.
*/

module.exports = function(r) {
  request = r;
  sdk = farmBudgetSdk.getSDK();

  return {
    get : get,
    getAll : getAll
  };
};

function getAll(callback) {
  var ids = Object.keys(datastore.budgets);

  async.eachSeries(
    ids,
    function(id, next){
      var parts = id.split('-');
      var state = id[0];
      var crops = id[1];

      get(crop, state, function(resp){
        datastore.budgets[id] = resp;
        next();
      });
    },
    callback
  );
}

function get(crop, state, callback) {
  crop = crop.toLowerCase();
  state = state.toLowerCase();

  var q = {
    query : {
      $text: {
        $search :'swap'
      },
      authority : 'AHB',
      commodity : crop,
      locality : state
    }, // mongodb query
    start : 0, // start index
    stop : 10, // stop index
  };

  sdk.budgets.search(q, function(resp){
    if( resp.total === 0 ) {
      var err = {
        error: true,
        message: 'Unable to find budget for '+crop+' in '+state
      };
      return callback(err);
    }

    sdk.loadBudget(resp.results[0].id, function(budget){
      var b = sdk.getTotal();

      callback({
        id : resp.results[0].id,
        budget : b
      });
    });
  });
}
