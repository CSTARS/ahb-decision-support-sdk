var init = require('./init');
var setFarmCost = require('./farmCost');


function ParcelController() {

  this.inject = function(collection) {
    this.collection = collection;
  }

  this.initNewParcel = init;
  this.setFarmCost = setFarmCost;

}

module.exports = new ParcelController();