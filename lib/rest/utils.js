var proj4 = require('proj4');
var geometryUtils = require('../geometry/utils');

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

module.exports = {
  vizSourceToTable : toTable,
  toAfriPx : geometryUtils.toAfriPx,
  llToMeters : geometryUtils.llToMeters
};
