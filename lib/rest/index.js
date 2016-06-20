var request = require('superagent');

module.exports = {
    parcels : require('./parcels')(request),
    weather : require('./weather')(request),
    soil : require('./soil')(request),
    crops : require('./crops')(request),
    budgets : require('./budgets')(request),
    transportation : require('./transportation')(request),
    refinery : require('./refinery')(request),
    exporter : require('./export')(request)
};