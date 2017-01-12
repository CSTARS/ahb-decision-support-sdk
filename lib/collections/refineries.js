var query = require('../rest/refinery');
var Model = require('../models/refinery');
var events = require('../events');

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

  events.on('get-selected-refinery', (e) => {
    e.handler(this.selected);
  });

  events.on('get-all-refineries', (e) => {
    e.handler(this.data);
  });

  events.on('set-selected-refinery-ror', (ror) => {
    this.selected.setRor(ror);
  });

  events.on('set-selected-refinery-max-pasture-land', (maxPastureLand) => {
    this.selected.setMaxPastureLand(maxPastureLand);
  });

  events.on('select-refinery', (e) => {
    this.select(e.name, e.ror, e.maxPastureLand);
  });

}

module.exports = new RefineryCollection();