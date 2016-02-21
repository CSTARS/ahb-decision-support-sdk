var DataStore = require('./datastore');
var ds = new DataStore();
var PoplarModel = require('./poplar');
var model = new PoplarModel(ds);

var sdk = {
  rest : require('./rest'),
  datastore : ds,
  model : model,
  config : require('./config')
};

module.exports = sdk;
