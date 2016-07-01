var extend = require('extend');
var async = require('async');
var poplar3pgModel = require('poplar-3pg-model');

var collection = require('../collections/growthProfiles');
var parcelCollection = require('../collections/parcels');
var events = require('../events');
var logger = require('../log');


function GrowthModel() {

  this.growAll = function(callback) {
    var c = 0;
    events.emit('harvests-start');

    // loop through all valid parcel ids
    async.eachSeries(parcelCollection.validIds,
      (id, next) => {
        // grab parcel for id
        parcelCollection.get(id, (parcel) => {
          // grow the parcel
          this.grow(parcel, (responseCode) => {
            // trigger event
            c++;
            this._onGrowComplete(parcel, responseCode, c, next);
          }); // end grow
        }); // end get parcel
      },
      () => {
        // done;
        if( callback ) callback();
        this.events.emit('harvests-end');
      }
    );
  };

  this._onGrowComplete = function(parcel, responseCode, count, next) {
    events.emit('harvests-updated', {
      id : parcel.properties.PolyID,
      profileId : parcel.properties.ucd.modelProfileId,
      data : parcel.properties.ucd.harvest,
      responseCode : responseCode,
      count : c,
      percent : Math.floor((c / parcelCollection.validCount)*100)
    });

    next();
  }

  this.grow = function(parcel, next) {
    collection.initProfile(parcel, (profile) => {
        var id = parcel.properties.ucd.modelProfileId;

        if( !id ) {
          logger.error('Failed to generate growth profile!! '+id+', parcel: '+parcel.properties.PolyID);
          return next(-1);
        }

        if( !profile ) {
          logger.error('Failed to generate growth profile!! '+id+', parcel: '+parcel.properties.PolyID);
          return next(-1);
        }

        if( profile.data ) {
          logger.log('cached 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);
          return next(1);
        }

        var config = profile.config;

        for( var key in config) {
          poplar3pgModel[key] = config[key];
        }
        poplar3pgModel.manage.datePlanted = new Date(config.manage.datePlanted);
        poplar3pgModel.manage.dateCoppiced = new Date(config.manage.dateCoppiced);
        // growthModel.tree = growthModel.plantation.coppicedTree;

        var harvests = [];
        logger.log('running 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);

        var t = new Date().getTime();
        try {
          poplar3pgModel.onHarvest = function(e) {
            harvests.push(e.data.WS);
          }.bind(this);

          var results = poplar3pgModel.run(this.monthsToRun);
          harvests.push(results[results.length-1][31]);

          if( isNaN(harvests[0]) ) {
            profile.growthError = true;
          } else {
            profile.growthError = false;
          }

          profile.data = this.setAmounts(parcel, harvests, profile);

          // TODO: we should be able to uncomment this now, memory is no
          // longer an issue here
          // profile.allData = results;
          profile.totalIrrigation = results[results.length-1][14] / 1000;

          // store new profile
          var profileItem = {
            id : id,
            data : JSON.stringify(profile)
          };

          collection.update(profileItem, () => {
            next(2);
          });

          return;
        } catch(e) {
          debugger;
          profile.growthError = true;
          logger.log('Error growing poplar!');
          logger.log(e);
          // the model will preform simple validation an throw errors if
          // inputs are is missing.
        }
        return next(-1);
    });
  };

  this.setAmounts = function(parcel, harvests) {
    var tmp = [];
    var total = 0;

    harvests.forEach(function(amount){
      var t = this.getHarvestAmount(amount);
      tmp.push(t);
      total += t;
    }.bind(this));

    var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;

    return {
      harvests : tmp,
      totalPerAcre : total,
      total : total * size,
      growArea : size,
      years : this.monthsToRun / 12
    };

  };

  this.getHarvestAmount = function(amount) {
    var amountInAcres = amount / 2.47105; // ha to acre
    return amountInAcres;
  };
}

module.exports = new GrowthModel();