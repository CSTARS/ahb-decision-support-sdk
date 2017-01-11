var events = require('../events');
var query = require('../rest/budgets');

function BudgetCollection() {
  this.poplarBudgets = [];
  this.budgetIds = [];

  // main data hash, currently stored in memory
  this.data = {};

  this.clear = function() {
    this.data = {};
    this.budgetIds = [];
  }

  this.get = function(id) {
    if( this.data[id] ) return this.data[id];
    for( var i = 0; i < this.poplarBudgets.length; i++ ) {
      if( this.poplarBudgets[i].budget.getId() === id ) return this.poplarBudgets[i];
    }
  }

  // called by parcels collection
  this.addBudgetId = function(id) {
    if( this.budgetIds.indexOf(id) > -1 ) return;
    this.budgetIds.push(id);
  }

  this.load = function(callback) {
    events.emit('budgets-update-start');

    // this uses the budgetsId array which is set by
    query.getAll(this, (data) => {
      this.data = data;
      events.emit('budgets-update-end');
      if( callback ) callback();
    });
  };

  this.setPoplarBudgets = function(budgets) {
    this.poplarBudgets = budgets;
  }

  this.getPoplarBudget = function(pyield) {
    for( var i = 0; i < this.poplarBudgets.length; i++ ) {
      if( pyield >= this.poplarBudgets[i].lowerBound && pyield <= this.poplarBudgets[i].upperBound ) {
        return this.poplarBudgets[i];
      }
    }

    // console.warn('No poplar budget for yield: '+pyield);
    return this.poplarBudgets[0];
  }

  events.on('get-budget', (e) => {
    e.handler(this.get(e.id));
  });

}

module.exports = new BudgetCollection();