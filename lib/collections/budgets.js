var events = require('../events');
var query = require('../rest/budgets');

function BudgetCollection() {
  this.poplarBudget = null;
  this.poplarTotal = 0;
  this.budgetIds = [];

  // main data hash, currently stored in memory
  this.data = {};

  this.clear = function() {
    this.data = {};
    this.budgetIds = [];
  }

  // called by parcels collection
  this.addBudgetId = function(id) {
    this.budgetIds.push(id);
  }

  this.getBudgets = function(callback) {
    events.emit('budgets-update-start');

    // this uses the budgetsId array which is set by
    query.getAll((data) => {
      this.data = data;
      events.emit('budgets-update-end');
      if( callback ) callback();
    });
  };

  this.setPoplarBudget = function(budget, total) {
    this.poplarBudget = budget;
    this.poplarTotal = budget;
  }

}

module.exports = new BudgetCollection();