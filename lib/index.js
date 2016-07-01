var config = require('./config')();
var logger = require('./log');

var collections = require('./collections');

// static data we can load at the beginning
function init(callback) {
  collections.refineries.load(()=> {
    collections.budgets.load(callback);
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
