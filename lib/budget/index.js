var config = require('../config')().budgets;
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
    SDK.budgets.search(query, function(resp){

      if( resp.results.length === 0) {
        console.log('Unable to find budget!!!!');
        return callback();
      }

      // just grab the first poplar budget
      var budget = resp.results[0];

      SDK.loadBudget(budget.id, function(resp) {
        callback();
      });
    }.bind(this));
  };

  // return per acre total
  this.getTotal = function() {
    var t = SDK.getTotal(); // this is grand total for farm, over lifetime
    var years = t.spendingByMonth.length / 12;
    return t.total / years / SDK.getBudget().getFarm().size;
  };
}

module.exports = Budget;
