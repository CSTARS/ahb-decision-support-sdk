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
    id : false,
  },
  start : 0,
  stop : 10
};

var total = 0;
var budget;

function Budget() {

  this.load = function(callback) {
      SDK.loadBudget(config.poplarBudgetId, function(resp) {
        budget = SDK.getBudget();
        var t = SDK.getTotal(); // this is grand total for farm, over lifetime
        var years = t.spendingByMonth.length / 12;
        total = t.total / years / SDK.getBudget().getFarm().size;

        callback(null, resp);
      });
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

module.exports = new Budget();
