var async = require('async');

var events = require('../events');
var localdb = require('../localdb');
var restQuery = require('../rest/competingParcels');
var controller = require('../controllers/parcels');

var budgetsCollection = require('./budgets');
var cropsCollection = require('./crops');
var transporationCollection = require('./transportation');
var growthProfilesCollection;

var DB_COLLECTION_NAME = 'parcels';

function ParcelCollection() {
  // list of all parcel ID's
  this.validIds = [];

  this.validCount = 0;
  // selected parcel count
  this.selectedCount = 0;
  // hash of afri px's to center point
  this.afriPxs = {};
  // list of center pts for each afri px
  this.centerPts = [];

  this.adoptionPrice = {
    min : -1,
    max : -1
  }

  this.mwa = 0;

  this.reset = function(callback) {
    this.validIds = [];
    this.validCount = 0;
    this.selectedCount = 0;
    this.afriPxs = {};
    this.centerPts = [];
    this.mwa = 0;

    this.adoptionPrice = {
      min : -1,
      max : -1
    }

    budgetsCollection.clear();
    cropsCollection.clear();
    growthProfilesCollection.clear(() => {
      localdb.clear(DB_COLLECTION_NAME, callback);
    });
  }


  this.load = function(lat, lng, radius, callback) {
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;

    events.emit('parcels-update-start');
    
    this.reset(() => {
      // cyclical dependency issue, so passing reference to this collection
      restQuery(lat, lng, radius, this, () => {
        if( callback ) callback();
        events.emit('parcels-update-end');
      });
    });
  };


  /**
   * Add A parcel to the collection
   */
  this.add = function(parcel, callback) {
      this.validCount++;
      this.validIds.push(parcel.properties.id);

      for( var j = 0; j < parcel.properties.ucd.cropInfo.swap.length; j++ ) {
        // for later query on crop type info
        cropsCollection.addSwapType(parcel.properties.ucd.cropInfo.swap[j]);

        // for later query to load budgets
        var state = parcel.properties.ucd.state.toLowerCase();
        var crop = parcel.properties.ucd.cropInfo.swap[j].toLowerCase();
        var bid = state+'-'+crop;

        parcel.properties.ucd.budgetIds.push(bid);
        budgetsCollection.addBudgetId(bid);
      }

      cropsCollection.addFips(parcel.properties.ucd.cropInfo.fips);

      // keep a list of used afriPx's w/ a lat/lng that is inside the px
      this.afriPxs[parcel.properties.ucd.afriPx] = parcel.properties.ucd.center;
      this.centerPts.push([parcel.properties.ucd.center[0], parcel.properties.ucd.center[1], parcel.properties.id]);

      localdb.add(DB_COLLECTION_NAME, parcel, () => {
        callback();
      });
  }

  this.update = function(parcel, callback) {
    localdb.put(DB_COLLECTION_NAME, parcel, callback);
  }

  this.get = function(id, callback) {
    localdb.get(DB_COLLECTION_NAME, id, callback);
  }


  /**
   * Get total arces, amount harvests, years, crop type counts
   * and average year harvest for all parcels in system that
   * have been flaged as a 'selected' parcel
   */
  this.summarize = function(callback) {
    var cropCounts = {};
    var selectedProfiles = {};
    var totalAcres = 0;

    events.emit('results-summary-start');

    localdb.find(DB_COLLECTION_NAME, 'selected', 1, 
      (parcel, next) => {
        // store the harvest profile id and parcel size for later
        var id = parcel.properties.ucd.modelProfileId;
        if( !selectedProfiles[id] ) {
          selectedProfiles[id] = [];
        }
        selectedProfiles[id].push(parcel.properties.usableSize);

        // sum usable size
        totalAcres += parcel.properties.usableSize;

        // sum total crops by name
        parcel.properties.ucd.cropInfo.swap.forEach(function(name){
          if( cropCounts[name] === undefined ) {
            cropCounts[name] = 0;
          }
          cropCounts[name]++;
        });

        next();
      },
      () => {
        this._summarizeHarvests(selectedProfiles, cropCounts, totalAcres, callback);
      }
    );
  }

  this._summarizeHarvests = function(modelIds, cropCounts, totalAcres, callback) {
    var totalHarvested = 0;
    var array = Object.keys(modelIds);
    var years = growthProfilesCollection.years;

    async.eachSeries(
      array,
      (id, next) => {
        growthProfilesCollection.get(id, (harvest) => {
          harvest = harvest.data;

          modelIds[id].forEach((acres) => {
            totalHarvested += harvest.totalPerAcre * acres;
          });

          next();
        });
      },
      () => {
        this.summary = {
          acres : totalAcres,
          harvested : totalHarvested,
          years : years,
          cropCounts : cropCounts,
          avgYearHarvest : totalHarvested / years
        }

        events.emit('results-summary-end');
        callback(this.summary);
      }
    )
    
  }

  this.inject = function(gpCollection) {
    growthProfilesCollection = gpCollection;
  }

  // handle cyclical dependency
  transporationCollection.inject(this);
  controller.inject(this);
}

module.exports = new ParcelCollection();