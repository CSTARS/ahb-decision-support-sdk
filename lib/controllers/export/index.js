var parcels = require('../../collections/parcels');
var growthProfiles = require('../../collections/growthProfiles');
var transportation = require('../../collections/transportation');

function toJson() {
    var hash = parcels.getAllInline();

    var features = [];
    for( var id in hash ) {
        features.push(hash[id]);
    }
    

    return {
        parcels : {
            type : 'FeatureCollection',
            features : features
        },
        growthProfiles : growthProfiles.getAllInline(),
        transportation : transportation.data
    }
}

module.exports = {
    toJson : toJson
}