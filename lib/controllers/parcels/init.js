var md5 = require('md5');
var geometryUtils = require('../../geometry/utils');
var setFarmCost = require('./farmCost');

var removeCropInfoAttrs = ['confidence','id','irrigated_yield','nonirrigated_yield','price_unit','unit','yield','yield_src'];


function process(parcel, lookup) {
    var geom = parcel.geometry;
    var id = md5(JSON.stringify({type: geom.type, coordinates: geom.coordinates}));

    if( !lookup[id] ) {
        return null;
    } else {
        parcel.properties.id = parcel.properties.PolyID;
        delete parcel.properties.PolyID;

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

            // HACK - JM
            // Crop price/yield service is not return spring wheat
            if( prop.cropInfo.swap[j] === 'Spring Wheat' ) {
                prop.cropInfo.swap[j] = 'Winter Wheat';
            }
        }

        /**
         * Let's save some memory.  Only store what we need here
         */
        for( var j = 0; j < removeCropInfoAttrs.length; j++ ) {
            delete prop.cropInfo[removeCropInfoAttrs[j]];
        }

        if( valid ) {
            var pointInfo = geometryUtils.getPointForFeature(parcel);
            parcel.properties.ucd.center = pointInfo.latlng;
            // also set the afri px id
            parcel.properties.ucd.afriPx = pointInfo.afriPx;
            parcel.properties.ucd.budgetIds = [];


            parcel.properties.usableSize = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel

            return parcel;
        }
    }
    
    return null;
}

module.exports = process;