var assert = require('assert');

describe('Rest API - Weather', function() {
  var restApi = require('../../lib/rest');
  var lng = -121.9921875;
  var lat = 39.02771884021161;
  var features;

  it('get a weather for a lat lng', function(next){
    restApi.weather.get(lat, lng, function(err, resp, cacheHit){
      assert.equal(err, null);
      assert.equal(Array.isArray(resp), true);
      assert.equal(resp.length, 12);
      assert.equal(cacheHit, false);
      next();
    });
  });

  it('weather for the same lat/lng should be a cache hit', function(next){
    restApi.weather.get(lat, lng,  function(err, resp, cacheHit){
      assert.equal(err, null);
      assert.equal(Array.isArray(resp), true);
      assert.equal(resp.length, 12);
      assert.equal(cacheHit, true);
      next();
    });
  });

});
