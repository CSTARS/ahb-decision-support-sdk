var config = require('../config')().budgets;
var extend = require('extend');
var SDK = require('farm-budgets-sdk')({
  host : config.url,
  token : ''
});

var query = {
  query : {
    commodity : config.commodity,
    authority : config.authority
  },
  start : 0,
  stop : 10
};

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
      var budget = resp.results[0];

      SDK.loadBudget(budget.id, function(resp) {
        callback(null, resp);
      });
    }.bind(this));
  };

  // return per acre total
  this.getTotal = function() {
    var t = SDK.getTotal(); // this is grand total for farm, over lifetime
    var years = t.spendingByMonth.length / 12;
    return t.total / years / SDK.getBudget().getFarm().size;
  };

  this.getTotal = function() {
    var t = SDK.getTotal(); // this is grand total for farm, over lifetime
    var years = t.spendingByMonth.length / 12;
    return t.total / years / SDK.getBudget().getFarm().size;
  };

  this.getTotalDetails = function() {
    return SDK.getTotal();
  };
}

module.exports = Budget;
