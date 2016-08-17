var parcels = require('../../collections/parcels');
var growthProfiles = require('../../collections/growthProfiles');

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
        growthProfiles : growthProfiles.getAllInline()
    }
}

module.exports = {
    toJson : toJson
}