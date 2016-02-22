var DataStore = require('./datastore');
var ds = new DataStore();

var FarmBudget = require('./budget');
var budget = new FarmBudget();

var PoplarModel = require('./poplar');
var model = new PoplarModel(ds, budget);

function init(callback) {
  budget.load(callback);
}

function grow(callback) {
  sdk.datastore.getWeather(function(weather){
    sdk.datastore.getSoil(function(soil){
      sdk.model.growAll();
      if( callback ) callback();
    });
  });
}

var sdk = {
  rest : require('./rest'),
  datastore : ds,
  model : model,
  budget : budget,
  config : require('./config'),
  init : init,
  grow : grow
};

module.exports = sdk;
