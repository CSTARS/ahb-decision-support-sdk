var breakdown = require('./breakdown');
var selectParcels = require('./selectParcels');

module.exports = function(datastore, farmBudgetSdk, poplarModel) {
  return {
    breakdown : breakdown(datastore, farmBudgetSdk, poplarModel),
    selectParcels : selectParcels(datastore, farmBudgetSdk, poplarModel),
    refinery : require('./refinery')
  };
};
