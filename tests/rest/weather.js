var assert = require('assert');

describe('Rest API - Weather', function() {
  var restApi = require('../../lib/rest');
  var features;

  it('get a weather for a lat lng', function(next){
    restApi.weather.get(-121.9921875, 39.02771884021161, function(err, resp){
      assert.equal(err, null);
      assert.equal(Array.isArray(resp), true);
      assert.equal(resp.length, 12);
      next();
    });
  });


});
