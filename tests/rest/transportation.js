
var assert = require('assert');

var stop = [40.600445, -122.204414];
var start1 = [40.620445, -122.224414];
var start2 = [40.580445, -122.184414];

describe('Rest API - Transportation', function() {
  var restApi = require('../../lib/rest');

  it('get a single point transportation', function(next){
    restApi.transportation.get(start1, stop, function(err, resp, cached){
      assert.equal(err, null);
      assert.equal(Math.round(resp.transportation.properties.distance), 2792);
      assert.equal(cached, false);
      next();
    });
  });

  it('get a single point transportation, cache hit', function(next){
    restApi.transportation.get(start1, stop, function(err, resp, cached){
      assert.equal(err, null);
      assert.equal(cached, true);
      next();
    });
  });

  it('get a multiple point transportation', function(next){
    restApi.transportation.getAll([start1, start2], stop, function(err, resp){
      assert.equal(err, null);
      assert.equal(Array.isArray(resp), true);
      assert.equal(resp.length, 2);
      next();
    });
  });
});
