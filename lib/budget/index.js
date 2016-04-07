var config = require('../config')().budgets;
var extend = require('extend');
var SDK = require('farm-budgets-sdk')({
  host : config.url,
  token : ''
});

var query = {
  query : {
    commodity : config.commodity,
    authority : config.authority,
    draft : false,
  },
  start : 0,
  stop : 10
};

var total = 0;
var budget;

function Budget() {

  this.load = function(callback) {
    var q = extend(true, {}, query);
    SDK.budgets.search(q, function(resp){
      if( resp.error ) {
        return callback(resp);
      }

      if( resp.results.length === 0) {
        return callback({
          error : true,
          message : 'Unable to find budget'
        });
      }

      // just grab the first poplar budget
      budget = resp.results[0];

      SDK.loadBudget(budget.id, function(resp) {
        budget = SDK.getBudget();
        var t = SDK.getTotal(); // this is grand total for farm, over lifetime
        var years = t.spendingByMonth.length / 12;
        total = t.total / years / SDK.getBudget().getFarm().size;

        callback(null, resp);
      });
    }.bind(this));
  };

  this.getSDK = function() {
    return SDK;
  };

  this.getPoplarTotal = function() {
    return total;
  };

  this.getPoplarBudget = function() {
    return budget;
  };

}

module.exports = Budget;
