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

function toTable(vizSourceResp) {
  vizSourceResp = vizSourceResp.replace('google.visualization.Query.setResponse(', '').replace(/\);$/, '');

  try {
    var json = JSON.parse(vizSourceResp);
    if( json.status === 'error' ) {
      json.error = true;
      return json;
    }

    return convertToObj(json);
  } catch(e) {
    return {
      error : true,
      message : 'invalid json response',
      e : e
    };
  }
}

function convertToObj(json) {
  var resp = [];

  for( var i = 0; i < json.table.rows.length; i++ ) {
    var row = {};

    for( var j = 0; j < json.table.cols.length; j++ ) {
      row[json.table.cols[j].id] = json.table.rows[i].c[j].v;
    }

    resp.push(row);
  }

  return resp;
}

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
  vizSourceToTable : toTable,
  toAfriPx : toAfriPx,
  llToMeters : llToMeters
};
