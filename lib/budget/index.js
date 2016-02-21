var config = require('../config');
var SDK = require('farm-budgets-sdk')({
  host : config().budgetsUrl,
  token : ''
});

var query = {
  query : {
    commodity : 'poplar'
  },
  start : 0,
  stop : 10
};

function Budget() {

  this.load = function(callback) {
    SDK.budgets.search(query, function(resp){
      var budget;
      for( var i = 0; i < resp.results.length; i++ ) {
        budget = resp.results[i];
        if( budget.authority === 'AHB') {
          break;
        }
      }

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
