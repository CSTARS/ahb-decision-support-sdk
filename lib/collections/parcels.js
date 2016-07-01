var events = require('../events');
var localdb = require('../localdb');
var restQuery = require('../reset/competingParcels');

var budgetsCollection = require('./budgets');
var cropsCollection = require('./crops');

var DB_COLLECTION_NAME = 'parcels';

function ParcelCollection() {
  // list of all parcel ID's
  this.validIds = [];

  this.validCount = 0;
  // selected parcel count
  this.selectCount = 0;
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
    this.selectCount = 0;
    this.afriPxs = {};
    this.centerPts = [];
    this.mwa = 0;

    this.adoptionPrice = {
      min : -1,
      max : -1
    }

    budgetsCollection.clear();
    cropsCollection.clear();

    localdb.clear(DB_COLLECTION_NAME, callback);
  }



  this.getParcels = function(lat, lng, radius, callback) {
    this.lat = lat;
    this.lng = lng;
    this.radius = radius;

    events.emit('parcels-update-start');
    
    this.reset(() => {
      restQuery(lat, lng, radius, () => {
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
      this.validParcelIds.push(parcel.properties.id);

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
        next();
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
    var totalAcres = 0;
    var totalHarvested = 0;
    var years = this.poplarModel.years;
    var cropCounts = {};

    localdb.find(DB_COLLECTION_NAME, 'selected', 1, 
      (parcel, next) => {
        var harvest = parcel.properties.ucd.harvest;
        if( !harvest ) return next();

        totalAcres += harvest.growArea;
        totalHarvested += harvest.total;

        parcel.properties.ucd.cropInfo.swap.forEach(function(name){
          if( cropCounts[name] === undefined ) {
            cropCounts[name] = 0;
          }
          cropCounts[name]++;
        });

        next();
      },
      () => {
        this.summary = {
          acres : totalAcres,
          harvested : totalHarvested,
          years : years,
          cropCounts : cropCounts,
          avgYearHarvest : totalHarvested / years
        }
        callback(this.summary);
      }
    );
  }
}

module.exports = new ParcelCollection();