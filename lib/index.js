var config = require('./config')();
var logger = require('./log');

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
      sdk.model.growAll(callback);
    });
  });
}

var sdk = {
  rest : require('./rest'),
  datastore : ds,
  model : model,
  budget : budget,
  config : config,
  init : init,
  grow : grow,
  logger : logger
};

module.exports = sdk;
