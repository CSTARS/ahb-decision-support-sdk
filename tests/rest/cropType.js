
var assert = require('assert');

// TODO: set these up to real northwest coordinates
// when service is live
var geo1 = {
  type : 'Feature',
  geometry : {
    type : 'Polygon',
    coordinates : [
      [[1,0],[1,1],[0,1],[0,0]]
    ]
  },
  properties : {
    id : 'foo'
  }
};

var geo2 = {
  type : 'Feature',
  geometry : {
    type : 'Polygon',
    coordinates : [
      [[2,0],[2,2],[0,2],[0,0]]
    ]
  },
  properties : {
    id : 'bar'
  }
};



describe('Rest API - Crop Type', function() {
  var restApi = require('../../lib/rest');

  it('get a single geometry crop type', function(next){
    restApi.cropType.get(geo1, function(err, resp, cached){
      assert.equal(err, null);
      assert.equal(typeof resp.crop, 'string');
      assert.equal(typeof resp.yield, 'number');
      assert.equal(cached, false);
      next();
    });
  });

  it('get a single geometry crop type, cached', function(next){
    restApi.cropType.get(geo1, function(err, resp, cached){
      assert.equal(err, null);
      assert.equal(typeof resp, 'object');
      assert.equal(cached, true);
      next();
    });
  });

  it('get an array of geometry crop types', function(next){
    restApi.cropType.getAll([geo1, geo2], function(err, resp){
      assert.equal(err, null);
      assert.equal(Array.isArray(resp), true);
      next();
    });
  });

});
