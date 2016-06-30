var proj4 = require('proj4');

var afri = {
  bounds : {
    west : -393216,
    south :  -720896,
    east : 524288,
    north : 589824
  },
  pxSize : 8192,
  projection : '+proj=aea +lat_1=41 +lat_2=47 +lat_0=44 +lon_0=-120 +x_0=0 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
};

function toAfriPx(lat, lng) {
  var xy = llToMeters(lat, lng);

  var east = xy[0];
  var north = xy[1];
  var x = (xy[0] - afri.bounds.west + afri.pxSize/2) / afri.pxSize;
  var y = (afri.bounds.north + afri.pxSize/2 - xy[1] ) / afri.pxSize;

  return [Math.floor(x), Math.floor(y)];
}

function llToMeters(lat, lng) {
  return proj4('EPSG:4326', afri.projection, [lng, lat]);
}


// Position, decimal degree
// http://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
function buffer(lat, lng, radius) {
   //Earth’s radius, sphere
   var R = 6378137;

   //offsets in meters
   var dn = radius;
   var de = radius;

   //Coordinate offsets in radians
   var dLat = dn / R;
   var dLon = de / (R * Math.cos(Math.PI * lat / 180));

   //OffsetPosition, decimal degrees
   return [lat + dLat * 180 / Math.PI, lng + dLon * 180 / Math.PI];
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

        return {
          latlng : [lng, lat],
          afriPx : toAfriPx(lat, lng).join('-')
        }
    }


    throw(new Error('Unsupported feature type'));
};

module.exports = {
  toAfriPx : toAfriPx,
  llToMeters : llToMeters,
  buffer : buffer,
  getPointForFeature : getPointForFeature
};