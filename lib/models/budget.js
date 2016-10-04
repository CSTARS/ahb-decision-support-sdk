var extend = require('extend');
var config = require('../config')().budgets;
var SDK = require('farm-budgets-sdk')({
  host : config.url,
  token : ''
});

// will be injected
var collection;

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
  
  this.init = function(col, callback) {
    this.inject(col);
    this.loadPoplarBudget(callback);
  }

  this.inject = function(col) {
    collection = col;
  }

  this.loadPoplarBudget = function(callback) {
      SDK.loadBudget(config.poplarBudgetId, function(resp) {
        budget = SDK.getBudget();
        var t = SDK.getTotal(); // this is grand total for farm, over lifetime
        var years = t.spendingByMonth.length / 12;
        total = t.total / years / SDK.getBudget().getFarm().size;

        collection.setPoplarBudget(budget, total);
        callback();
      });
  };

  this.getSDK = function() {
    return SDK;
  };

}

module.exports = new BudgetModel();