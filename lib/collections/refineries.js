var query = require('../rest/refinery');
var Model = require('../models/refinery');

function RefineryCollection() {
  this.selected = null;

  this.data = [];

  this.load = function(callback) {
    query.getAll((refineries) => {
      this.data = refineries;
      callback();
    });
  }

  this.select = function(name, ror, maxPastureLand) {
    this.data.forEach((r) => {
      if( r.name === name ) {
        this.selected = new Model(r, this, ror);
        this.selected.maxPastureLandAdoption = maxPastureLand;
      }
    });
  }

  this.getAll = function() {
    return this.data;
  }

}

module.exports = new RefineryCollection();