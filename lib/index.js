var config = require('./config')();
var logger = require('./log');

var FarmBudget = require('./budget');
var budget = new FarmBudget();

var DataStore = require('./datastore');
var ds = new DataStore(budget);

var PoplarModel = require('./poplar');
var model = new PoplarModel(ds, budget);

ds.poplarModel = model;

function init(callback) {
  budget.load(callback);
}

function grow(callback) {
  sdk.datastore.getWeather(function(weather){
    sdk.datastore.getSoil(function(soil){
      sdk.poplarModel.growAll(callback);
    });
  });
}

var sdk = {
  rest : require('./rest')(budget),
  adoption : require('./adoption')(ds, budget),
  revenue : require('./revenue'),
  datastore : ds,
  poplarModel : model,
  budget : budget,
  config : config,
  init : init,
  grow : grow,
  logger : logger
};

module.exports = sdk;
