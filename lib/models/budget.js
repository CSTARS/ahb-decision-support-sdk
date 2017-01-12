var extend = require('extend');
var async = require('async');
var config = require('../config')().budgets;
var query = require('../rest/budgets');
var SDK = require('farm-budgets-sdk')({
  host : config.url,
  token : ''
});

// will be injected
var collection, query;

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
    this.loadPoplarBudgets(callback);
  }

  this.inject = function(col, q) {
    collection = col;
  }

  this.injectQuery = function(q) {
    query = q;
  }

  this.loadPoplarBudgets = function(callback) {
    query.find('Poplar', function(resp){
      if( resp.error ) return alert('Error loading poplar budgets');

      var budget, total, budgets = [];

      async.eachSeries(
        resp,
        function(item, next) {
          SDK.loadBudget(item.id, function(resp) {
            budget = SDK.getBudget();
            var t = SDK.getTotal(); // this is grand total for farm, over lifetime
            var years = t.spendingByMonth.length / 12;
            total = t.total / years / SDK.getBudget().getFarm().size;

            var bounds = (budget.getData().description || ' ').split('-');
            if( bounds.length === 1) bounds.push('-1');

            bounds = bounds.map(function(bound){
              return parseFloat(bound.replace(/[^0-9.]/g, ''));
            });


            budgets.push({
              budget : budget,
              total : total,
              lowerBound : bounds[0] || 0,
              upperBound : bounds[1] || 99999
            });

            next();
          });
        },
        function(err) {
          collection.setPoplarBudgets(budgets);
          callback();
        }
      );

    });
      
  };

  this.getSDK = function() {
    return SDK;
  };

}

module.exports = new BudgetModel();