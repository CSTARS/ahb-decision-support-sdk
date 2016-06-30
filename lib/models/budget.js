var extend = require('extend');
var SDK = require('farm-budgets-sdk')({
  host : config.url,
  token : ''
});

var config = require('../config')().budgets;
var collection = require('../collection/budgets');

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

function BudgetModel() {

  this.loadPoplarBudget = function(callback) {
      SDK.loadBudget(config.poplarBudgetId, function(resp) {
        budget = SDK.getBudget();
        var t = SDK.getTotal(); // this is grand total for farm, over lifetime
        var years = t.spendingByMonth.length / 12;
        total = t.total / years / SDK.getBudget().getFarm().size;

        collection.setPoplarBudget(budget, total);
      });
  };

  this.getSDK = function() {
    return SDK;
  };

}

module.exports = new BudgetModel();