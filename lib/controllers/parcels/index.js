var init = require('./init');
var collection = require('../collections/parcels');

function ParcelController() {

  this.initNewParcel = init;
  this.collection = collection;

}

module.exports = new ParcelController();