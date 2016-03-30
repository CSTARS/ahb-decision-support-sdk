var request = require('superagent');

module.exports = function(farmBudgetSdk) {
  return {
    parcels : require('./parcels')(request),
    weather : require('./weather')(request),
    soil : require('./soil')(request),
    crops : require('./crops')(request),
    budgets : require('./budgets')(request, farmBudgetSdk),
    transportation : require('./transportation')(request)
  };
};
