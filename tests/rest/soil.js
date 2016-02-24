var assert = require('assert');

describe('Rest API - Soil', function() {
  var restApi = require('../../lib/rest');
  var lng = -121.9921875;
  var lat = 39.02771884021161;
  var features;

  it('get a soil for a lat lng', function(next){
    restApi.soil.get(lat, lng, function(err, resp, cacheHit){
      assert.equal(err, null);
      assert.equal(typeof resp, 'object');
      assert.deepEqual(Object.keys(resp), ['swpower', 'swconst','maxAWS']);
      assert.equal(cacheHit, false);
      next();
    });
  });

  it('soil for the same lat/lng should be a cache hit', function(next){
    restApi.soil.get(lat, lng,  function(err, resp, cacheHit){
      assert.equal(err, null);
      assert.equal(typeof resp, 'object');
      assert.equal(cacheHit, true);
      next();
    });
  });

});
