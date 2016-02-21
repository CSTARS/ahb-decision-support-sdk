var DataStore = require('./datastore');
var ds = new DataStore();

var FarmBudget = require('./budget');
var budget = new FarmBudget();

var PoplarModel = require('./poplar');
var model = new PoplarModel(ds, budget);

var sdk = {
  rest : require('./rest'),
  datastore : ds,
  model : model,
  budget : budget,
  config : require('./config')
};

module.exports = sdk;
