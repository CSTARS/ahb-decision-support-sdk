var assert = require('assert');

describe('Budget API Testing', function() {
  var budget = require('../../lib/budget');
  var config = require('../../lib/config')();
  var lng = -121.9921875;
  var lat = 39.02771884021161;
  var features;

  before(function(){
    budget = new budget();
  });

  it('should load the AHB Poplar budget from farmbudgets.org', function(next){
    budget.load(function(err, resp) {
      assert.equal(null, err);
      assert.equal(resp.getCommodity(), config.budgets.commodity);
      next();
    });
  });

  it('should be able to calculate the total', function(){
    assert.equal(typeof budget.getTotal(), 'number');

    var details = budget.getTotalDetails();
    assert.equal(typeof details.total, 'number');
    assert.equal(typeof details.range, 'object');
    assert.equal(Array.isArray(details.spendingByMonth), true);
  });

});
