/**
  TODO: Query should return a crop type for a given geometry (geojson polygon/multipolygon)
**/
var async = require('async');
var request, sdk;
var cache = {};

/*
 Water data, stubbed for now.
*/

module.exports = function(r, farmBudgetSdk) {
  request = r;
  sdk = farmBudgetSdk.getSDK();

  return {
    get : get,
    getAll : getAll
  };
};

function getAll(parcels, callback) {
  async.eachSeries(
    parcels,
    function(parcel, next){
      var state = parcel.properties.ucd.state;
      var crops = parcel.properties.ucd.cropInfo.swap;

      var budgets = [];
      parcel.properties.ucd.cropInfo.cropBudgets = budgets;

      async.eachSeries(
        crops,
        function(crop, cb) {
          get(crop, state, function(resp){
            budgets.push(resp);
            cb();
          });
        },
        function(err) {
          if( err ) console.log(err);
          next();
        }
      );
    },
    callback
  );
}

function get(crop, state, callback) {
  crop = crop.toLowerCase();
  state = state.toLowerCase();

  if( cache[crop+state] ) {
    return callback(cache[crop+state]);
  }

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
      cache[crop+state] = err;
      return callback(err);
    }

    sdk.loadBudget(resp.results[0].id, function(budget){
      var b = sdk.getTotal();
      cache[crop+state] = {
        id : resp.results[0].id,
        budget : b
      };
      callback(cache[crop+state]);
    });
  });
}
