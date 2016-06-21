var config = require('./config')();
var logger = require('./log');

// order matters here ... sorry :(
var farmBudget = require('./budget');
var ds = require('./datastore');
var model = require('./poplar');

ds.poplarModel = model;

function init(callback) {
  farmBudget.load(callback);
}

function grow(callback) {
  sdk.datastore.getWeather(function(weather){
    sdk.datastore.getSoil(function(soil){
      sdk.poplarModel.growAll(callback);
    });
  });
}

var sdk = {
  rest : require('./rest'),
  adoption : require('./adoption'),
  optimize : require('./optimize'),
  revenue : require('./revenue'),
  datastore : ds,
  poplarModel : model,
  budget : farmBudget,
  config : config,
  init : init,
  grow : grow,
  localdb : require('./localdb'),
  logger : logger
};

module.exports = sdk;
