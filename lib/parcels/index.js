var md5 = require('md5');
var datastore = require('../datastore');
var geometryUtils = require('../geometry/utils');

function process(parcel, lookup) {
    var geom = parcel.geometry;
    var id = md5(JSON.stringify({type: geom.type, coordinates: geom.coordinates}));
    if( !lookup[id] ) {
        return null;
    } else {
        parcel.properties.id = parcel.properties.ParcelID
        var prop = parcel.properties.ucd;

        prop.cropInfo = lookup[id];
        prop.state = lookup[id].state;

        prop.budgetIds = [];

        /**
         * Check for valid crop type
         * hack some changes to crop type names
         */
        var valid = true;
        for( var j = 0; j < prop.cropInfo.swap.length; j++ ) {
            if( prop.cropInfo.swap[j].toLowerCase() === 'n/a' ) {
                valid = false;
                break;
            }

            if( prop.cropInfo.swap[j].toLowerCase() === 'shrubland' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
            }

            if( prop.cropInfo.swap[j] === 'Grassland/Pasture' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
            }
            /*if( prop.cropInfo.swap[j] === 'N/A' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
            }*/
            if( prop.cropInfo.swap[j] === 'Grass Hay' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
            }

            // for later query on crop type info
            datastore.swapTypes[prop.cropInfo.swap[j]] = true;

            // for later query to load budgets
            var state = prop.state.toLowerCase();
            var crop = prop.cropInfo.swap[j].toLowerCase();
            var bid = state+'-'+crop;

            prop.budgetIds.push(bid);
            datastore.budgets[bid] = null;
        }

        if( valid ) {
            datastore.cropFips[prop.cropInfo.fips] = true;
            getPointForFeature(parcel);

            // keep a list of used afriPx's w/ a lat/lng that is inside the px
            datastore.afriPxs[parcel.properties.ucd.afriPx] = parcel.properties.ucd.center;
            datastore.centerPts.push([parcel.properties.ucd.center[0], parcel.properties.ucd.center[1], parcel.properties.id]);

            parcel.properties.usableSize = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel
            
            return parcel;
        }
    }
    
    return null;
}

  // help for getting a useful point from a feature.
  // currently just using the first point in the polygon
function getPointForFeature(feature) {
    var coords;
    if( feature.geometry.type === 'Polygon' ) {
        coords = feature.geometry.coordinates[0];
    } else if ( feature.geometry.type === 'MultiPolygon' ) {
        coords = feature.geometry.coordinates[0][0];
    }

    if( coords ) {
        var lng = 0, lat = 0;
        for( var i = 0; i < coords.length; i++ ) {
        lng += coords[i][0];
        lat += coords[i][1];
        }
        lng = lng / coords.length;
        lat = lat / coords.length;
        feature.properties.ucd.center = [lng, lat];

        // also set the afri px id
        feature.properties.ucd.afriPx = geometryUtils.toAfriPx(lat, lng).join('-');

        feature.properties.id = feature.properties.PolyID;

        return feature.properties.ucd.center;
    }


    throw(new Error('Unsupported feature type'));
};

module.exports = {
    process : process
}