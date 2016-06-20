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

module.exports = {
  toAfriPx : toAfriPx,
  llToMeters : llToMeters
};