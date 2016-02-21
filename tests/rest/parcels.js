
var assert = require('assert');

describe('Rest API - Parcels', function() {
  var restApi = require('../../lib/rest');
  var features;

  it('get a set of parcels given lat/lng and radius', function(next){
    restApi.parcels.get(40.600445, -122.204414, 1000, function(err, resp){
      assert.equal(err, null);
      assert.equal(resp.length, 11);
      features = resp;
      next();
    });
  });

  it('should have returned geojson', function(){
    var f = features[0];
    assert.equal(f.type, 'Feature');
    assert.equal(f.geometry.type, 'Polygon');
    assert.equal(typeof f.properties, 'object');
  });

});
