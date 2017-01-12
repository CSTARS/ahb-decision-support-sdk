var async = require('async');

var events = require('../events');
var localdb = require('../localdb');
var restQuery = require('../rest/competingParcels');
var parcelCacheQuery = require('../rest/parcelCache');
var controller = require('../controllers/parcels');

var budgetsCollection = require('./budgets');
var cropsCollection = require('./crops');
var transporationCollection = require('./transportation');
var growthProfilesCollection;

var DB_COLLECTION_NAME = 'parcels';

function ParcelCollection() {
  // list of all parcel ID's
  this.validIds = [];

  this.useParcelCache = true;

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

  this.refineryGatePrice = {
    min : -1,
    max : -1
  };

  this.mwa = 0;

  this.reset = function() {
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
    growthProfilesCollection.clear();
    localdb.clear(DB_COLLECTION_NAME);
  }


  this.load = function(lat, lng, radius, callback) {
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;

    events.emit('parcels-update-start');

    this.reset();
    if( this.useParcelCache ) {
      parcelCacheQuery(lat, lng, radius, this, () => {
        events.emit('parcels-update-end');
        if( callback ) callback();
      });
    } else {
      // cyclical dependency issue, so passing reference to this collection
      restQuery(lat, lng, radius, this, () => {
        events.emit('parcels-update-end');
        if( callback ) callback();
      });
    }
  };

  this.addMany = function(parcels) {
    parcels.forEach((parcel) => this.add(parcel));
  }

  /**
   * Add A parcel to the collection
   */
  this.add = function(parcel) {
      this.validCount++;
      this.validIds.push(parcel.properties.id);

      for( var j = 0; j < parcel.properties.ucd.cropInfo.swap.length; j++ ) {
        // for later query on crop type info
        cropsCollection.addSwapType(parcel.properties.ucd.cropInfo.swap[j]);

        // for later query to load budgets
        var state = (parcel.properties.ucd.state || 'unknown').toLowerCase();
        var crop = parcel.properties.ucd.cropInfo.swap[j].toLowerCase();
        var bid = state+'-'+crop;

        parcel.properties.ucd.budgetIds.push(bid);
        budgetsCollection.addBudgetId(bid);
      }

      cropsCollection.addFips(parcel.properties.ucd.cropInfo.fips);

      // keep a list of used afriPx's w/ a lat/lng that is inside the px
      this.afriPxs[parcel.properties.ucd.afriPx] = parcel.properties.ucd.center;
      this.centerPts.push([parcel.properties.ucd.center[0], parcel.properties.ucd.center[1], parcel.properties.id]);

      localdb.add(DB_COLLECTION_NAME, parcel);
  }

  this.update = function(parcel) {
    localdb.put(DB_COLLECTION_NAME, parcel);
  }

  this.get = function(id) {
    return localdb.get(DB_COLLECTION_NAME, id);
  }

  this.getAll = function() {
    return localdb.getAll(DB_COLLECTION_NAME);
  }


  /**
   * Get total arces, amount harvests, years, crop type counts
   * and average year harvest for all parcels in system that
   * have been flaged as a 'selected' parcel
   */
  this.summarize = function() {
    var cropCounts = {};
    var selectedProfiles = {};
    var totalAcres = 0;

    events.emit('results-summary-start');

    var parcel;
    var parcels = this.getAll();
    for( var key in parcels ) {
      parcel = parcels[key];

      if( !parcel.properties.ucd.selected ) continue;

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
    }

    return this._summarizeHarvests(selectedProfiles, cropCounts, totalAcres);
  }

  this._summarizeHarvests = function(modelIds, cropCounts, totalAcres) {
    var totalHarvested = 0;
    var array = Object.keys(modelIds);
    var years = growthProfilesCollection.years;

    array.forEach((id) => {
      var harvest = growthProfilesCollection.get(id).data;
      modelIds[id].forEach((acres) => {
        totalHarvested += harvest.totalPerAcre * acres;
      });
    });

    this.summary = {
      acres : totalAcres,
      harvested : totalHarvested,
      years : years,
      cropCounts : cropCounts,
      avgYearHarvest : totalHarvested / years,
      selectedCount : this.selectedCount,
      validCount : this.validCount,
      mwa : this.mwa
    }

    events.emit('results-summary-end', this.summary);
    return this.summary;
  }

  this.inject = function(gpCollection) {
    growthProfilesCollection = gpCollection;
  }

  events.on('get-valid-parcel-ids', (e) => {
    e.handler(this.validIds);
  });

  events.on('get-parcels-summary', (e) => {
    e.handler(this.summary);
  });

  events.on('get-parcels-refinery-gate-price', (e) => {
    e.handler(this.refineryGatePrice);
  });

  events.on('get-parcel', (e) => {
    e.handler(this.get(e.id));
  });

  events.on('get-parcels', (e) => {
    e.handler(this.getAll());
  });

  // handle cyclical dependency
  transporationCollection.inject(this);
  controller.inject(this);
}

module.exports = new ParcelCollection();