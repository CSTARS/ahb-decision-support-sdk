var md5 = require('md5');

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

        var valid = true;
        for( var j = 0; j < prop.cropInfo.swap.length; j++ ) {
            if( prop.cropInfo.swap[j].toLowerCase() === 'n/a' ) {
                valid = false;
                break;
            }

            if( prop.cropInfo.swap[j].toLowerCase() === 'shrubland' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
                continue;
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
        }

        if( valid ) {
            return parcel;
        }
    }
    
    return null;
}

module.exports = {
    process : process
}