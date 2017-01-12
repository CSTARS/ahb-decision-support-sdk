var parcels = require('../../collections/parcels');
var growthProfiles = require('../../collections/growthProfiles');
var transportation = require('../../collections/transportation');
var events = require('../../events');

function toJson() {
    var hash = parcels.getAll();

    var features = [];
    for( var id in hash ) {
        features.push(hash[id]);
    }
    

    return {
        parcels : {
            type : 'FeatureCollection',
            features : features
        },
        growthProfiles : growthProfiles.getAll(),
        transportation : transportation.data
    }
}

events.on('export-json', (e) => {
    e.handler(toJson());
});

module.exports = {
    toJson : toJson
}