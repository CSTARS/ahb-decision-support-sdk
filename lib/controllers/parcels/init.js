var md5 = require('md5');
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

            if( prop.cropInfo.swap[j] === 'Grass Hay' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
            }
        }

        if( valid ) {
            var pointInfo = geometryUtils.getPointForFeature(parcel);
            parcel.properties.ucd.center = pointInfo.latlng;
            // also set the afri px id
            parcel.properties.ucd.afriPx = pointInfo.afriPx;

            parcel.properties.id = parcel.properties.PolyID;

            parcel.properties.usableSize = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel
            
            return parcel;
        }
    }
    
    return null;
}

module.exports = process;