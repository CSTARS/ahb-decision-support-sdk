var collection = require('../collections/refineries');
var parcelsCollection = require('../collections/parcels');
var transportationCollection = require('../collections/transportation');
var cropsCollection = require('../collections/crops');
var weatherCollection = require('../collections/weather');
var soilCollection = require('../collections/soil');
var budgetsCollection = require('../collections/budgets');
var poplar = require('../models/growthModel');
var events = require('../events');

function RefineryController() {
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
    this.radius = options.radius;

    var runner = new ModelRunner(options, callback);
    runner.run();
  }

  // call if you modified prices
  this.optimize = function(options, callback) {
    // optimize the selected refinery
    collection.selected.optimize(options, () => {
      parcelsCollection.summarize(() => {
        if( callback ) callback();
      });
    });
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
    collection.selected.optimize(options, () => {
      parcelsCollection.summarize(() => {
        events.emit('refinery-model-run-complete');
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
    var loc = [options.lat, options.lng];
    transportationCollection.load(loc, options.routeGemetry, this.onParallelRequestComplete.bind(this));
    
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