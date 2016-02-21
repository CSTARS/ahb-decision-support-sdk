var request = require('superagent');

var api = {
  parcels : require('./parcels')(request),
  weather : require('./weather')(request),
  soil : require('./soil')(request)
};

module.exports = api;
