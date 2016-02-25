var assert = require('assert');

describe('Datastore - Integration Test', function() {
  var SDK = require('../../lib');
  var datastore;

  var lat = 40.600445;
  var lng = -122.204414;
  var radius = 5000;

  it('should initialize the SDK', function(next){
    SDK.init(function(err, resp){
      assert.equal(null, err);
      assert.equal(resp.getCommodity(), SDK.config.budgets.commodity);
      next();
    });
  });

  it('should grab required parcel information', function(next){
    this.timeout(5000);

    SDK.datastore.getParcels(lat, lng, radius, function(err, parcels){
      assert.equal(err, null);
      assert.equal(parcels.length, 29);

      next();
    });
  });

  it('should let you select all parcels', function(){
    SDK.datastore.randomizeSelected(0);
    assert.equal(true, true);
  });

  it('should let you lookup crop types', function(){
    SDK.datastore.getCropTypes(function(){
      assert.equal(typeof SDK.datastore.selectedParcels[0].properties.ucd.cropType, 'string');
    });
  });

  it('should let you grow the poplar and get a result', function(){
    SDK.grow(function(err, resp){
      assert.equal(err, null);
    });
  });



});
