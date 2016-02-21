var request;

var config = require('../config');
var extend = require('extend');
var ArcGIS = require('terraformer-arcgis-parser');

var queryPath = '/0/query';
var radiusQuery = {
  f: 'json',
  where: '',
  returnGeometry : true,
  spatialRel : 'esriSpatialRelIntersects',
  geometry : {
    xmin : -13638780.169064607,
    ymin : 4936478.709818284,
    xmax : -13589401.848792365,
    ymax: 4976225.964526591,
    spatialReference : {
      wkid : 4326,
      latestWkid: 3857
    }
  },
  geometryType : 'esriGeometryEnvelope',
  inSR : 4326,
  outFields : '*',
  outSR :4326
};

module.exports = function(r) {
  request = r;

  return {
    get : get
  };
};

function get(lat, lng, radius, callback) {
  var q = extend(true, {}, radiusQuery);

  var topLeft = buffer(lat, lng, radius);
  var bottomRight = buffer(lat, lng, -1 * radius);

  q.geometry = JSON.stringify({
    xmin : bottomRight[1],
    ymin : bottomRight[0],
    xmax : topLeft[1],
    ymax: topLeft[0],
    spatialReference : {
      wkid : 4326
    }
  });

  request
    .get(config().esriPracelUrl+queryPath)
    .query(q)
    .end(function(err, resp){
      if( err ) {
        callback(err);
      } else {
        try {
          var features = JSON
                          .parse(resp.text)
                          .features
                          .map(ArcGIS.parse)
                          .map(addNamespace);

          callback(null, features);
        } catch(e) {
          callback(e);
        }
      }
    });
}

function addNamespace(parcel) {
  parcel.properties.ucd = {};
  return parcel;
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
