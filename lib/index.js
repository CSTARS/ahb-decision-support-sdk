var config = require('./config')();
var logger = require('./log');

var collections = require('./collections');
var budget = require('./models/budget');

// static data we can load at the beginning
function init(callback) {
  collections.refineries.load(()=> {
    budget.init(collections.budgets, callback);
  });
}

var sdk = {
  rest : require('./rest'),
  eventBus : require('./events'),
  config : config,
  init : init,
  localdb : require('./localdb'),
  logger : logger,
  models : require('./models'),
  controllers : require('./controllers'),
  collections : collections
};
module.exports = sdk;
