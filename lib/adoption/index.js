var breakdown = require('./breakdown');
var selectParcels = require('./selectParcels');

module.exports = function(datastore, farmBudgetSdk) {
  return {
    breakdown : breakdown(datastore, farmBudgetSdk),
    selectParcels : selectParcels(datastore, farmBudgetSdk)
  };
};
