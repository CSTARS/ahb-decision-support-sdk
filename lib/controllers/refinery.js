var collection = require('../collections/refineries');
var parcelsCollection = require('../collections/parcels');
var transportationCollection = require('../collections/transportation');
var cropsCollection = require('../collections/crops');
var weatherCollection = require('../collections/weather');
var soilCollection = require('../collections/soil');
var budgetsCollection = require('../collections/budgets');
var poplar = require('../models/growthModel');

function RefineryController() {
  this.poplarPrice = 24;
  this.lat = 0;
  this.lng = 0;
  

  /**
   * Options
   *  - lat: Double
   *  - lng: Double
   *  - radius: Double
   *  - refinery: String
   */
  this.model = function(options, callback) {
    this.lat = options.lat;
    this.lng = options.lng;

    var runner = new ModelRunner(options, callback);
    runner.run();
  }
}




function ModelRunner(options, callback) {
  this.parallelRequestCount = 0;
  this.parallelRequestTotal = 4;


  this.run = function() {
    // set the selected refinery type (by name)
    collection.select(options.refinery);

    this.loadParcels();
  }


  this.loadParcels = function() {
    parcelsCollection.load(options.lat, options.lng, options.radius, () => {
      this.runParallelRequests();
    });
  }


  this.optimize = function() {
    // optimize the selected refinery
    collection.selected.optimize(() => {
      parcelsCollection.summarize(() => {
        callback();
      });
    });
  }


  this.onParallelRequestComplete = function() {
    this.parallelRequestCount++;

    if( this.parallelRequestCount === this.parallelRequestTotal ) {
      this.optimize();
    }
  }


  this.runParallelRequests = function() {
    transportationCollection.load(options.routeGemetry, this.onParallelRequestComplete.bind(this));
    
    cropsCollection.load(this.onParallelRequestComplete.bind(this));
    
    budgetsCollection.load(this.onParallelRequestComplete.bind(this));

    weatherCollection.load(() => {
      soilCollection.load(() => {
        poplar.growAll(this.onParallelRequestComplete.bind(this));
      });
    });
  }
}


module.exports = new RefineryController();