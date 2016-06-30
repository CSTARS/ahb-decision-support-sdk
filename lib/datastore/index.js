var events = require('events').EventEmitter;
var md5 = require('md5');

var exporter = require('../export');
var farmBudgetSdk = require('../budget');
var localdb = require('../localdb');

// TMP Stub for now.
// TODO: move to poplar budgets



function DataStore() {


  this.resetBookkeeping = function() {
    this.totalTransportationCost = 0;
  }
  this.resetBookkeeping();

  this.lat = 0;
  this.lng = 0;
  this.radius = 0;



  this.poplarPrice = 24;
  this.pastureConversion = 0.25;


  this.events = new events();

  this.getPoplarTotal = function() {
    return farmBudgetSdk.getPoplarTotal();
  };


  this.exportJson = function() {
    return exporter.toJson(farmBudgetSdk.getPoplarTotal(), this);
  }

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };
}

require('./weather')(DataStore);
require('./soil')(DataStore);
require('./transportation')(DataStore);
require('./crops')(DataStore);

var ds = new DataStore();
module.exports = ds

/// grrr cyclical dependencies
var competingParcels = require('../rest/competingParcels');
ds.rest = require('../rest');