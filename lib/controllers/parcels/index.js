var init = require('./init');
var setFarmCost = require('./farmCost');
var collection = require('../../collections/parcels');

function ParcelController() {

  this.initNewParcel = init;
  this.collection = collection;
  this.setFarmCost = setFarmCost;

}

module.exports = new ParcelController();