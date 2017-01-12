var extend = require('extend');
var async = require('async');
var poplar3pgModel = require('poplar-3pg-model');

var collection = require('../collections/growthProfiles');
var parcelCollection = require('../collections/parcels');
var events = require('../events');
var logger = require('../log');


function GrowthModel() {

  this.growAll = function(callback) {
    var count = 0;
    events.emit('harvests-start');

    // loop through all valid parcel ids
    async.eachSeries(parcelCollection.validIds,
      (id, next) => {

        // grab parcel for id
        var parcel = parcelCollection.get(id);
        
        // grow the parcel
        var responseCode = this.grow(parcel);
      
        // trigger event
        count++;
        this._onGrowComplete(parcel, responseCode, count, next);

        if( count % 10 === 0 ) {
            setTimeout(function(){
                next();
            }, 0);
        } else {
            next();
        }
      },
      () => {
        // done;

        // at this point we no longer need the soils or weather collections
        collection.cleanup();

        if( callback ) callback();
        events.emit('harvests-end');
      }
    );
  };

  this._onGrowComplete = function(parcel, responseCode, count) {
    events.emit('harvests-updated', {
      id : parcel.properties.id,
      profileId : parcel.properties.ucd.modelProfileId,
      data : parcel.properties.ucd.harvest,
      responseCode : responseCode,
      count : count,
      percent : Math.floor((count / parcelCollection.validCount)*100)
    });
  }

  this.grow = function(parcel, next) {
    var profile = collection.initProfile(parcel);
    var id = parcel.properties.ucd.modelProfileId;

    if( !id ) {
      logger.error('Failed to generate growth profile (1) !! '+id+', parcel: '+parcel.properties.id);
      return -1;
    }

    if( !profile ) {
      logger.error('Failed to generate growth profile (2) !! '+id+', parcel: '+parcel.properties.id);
      return -1;
    }

    if( profile.data ) {
      logger.log('cached 3pg model for profile (3) : '+id+', parcel: '+parcel.properties.id);
      return 1;
    }

    var config = profile.config;

    for( var key in config) {
      poplar3pgModel[key] = config[key];
    }
    poplar3pgModel.manage.datePlanted = new Date(config.manage.datePlanted);
    poplar3pgModel.manage.dateCoppiced = new Date(config.manage.dateCoppiced);
    // growthModel.tree = growthModel.plantation.coppicedTree;

    var harvests = [];
    logger.log('running 3pg model for profile: '+id+', parcel: '+parcel.properties.id);

    var t = new Date().getTime();
    try {
      poplar3pgModel.onHarvest = function(e) {
        harvests.push(e.data.WS);
      }.bind(this);

      var results = poplar3pgModel.run(collection.monthsToRun);
      harvests.push(results[results.length-1][31]);

      if( isNaN(harvests[0]) ) {
        profile.growthError = true;
      } else {
        profile.growthError = false;
      }

      profile.data = this.setAmounts(parcel, harvests, profile);

      // TODO: we should be able to uncomment this now, memory is no
      // longer an issue here
      //profile.allData = results;
      profile.ws = [];
      for( var i = 0; i < results.length; i++ ) {
        if( typeof results[i][31] === 'string' ) {
          continue;
        }
        profile.ws.push(results[i][31]);
      }
      profile.totalIrrigation = results[results.length-1][14] / 1000;

      // store new profile
      collection.update(profile);

      return 2;
    } catch(e) {
      debugger;
      profile.growthError = true;
      logger.log('Error growing poplar!');
      logger.log(e);
      // the model will preform simple validation an throw errors if
      // inputs are is missing.
    }
    return -1;
  };

  this.setAmounts = function(parcel, harvests) {
    var tmp = [];
    var total = 0;

    harvests.forEach(function(amount){
      var t = this.getHarvestAmount(amount);
      tmp.push(t);
      total += t;
    }.bind(this));

    return {
      harvests : tmp,
      totalPerAcre : total,
      years : collection.monthsToRun / 12
    };
  };

  this.getHarvestAmount = function(amount) {
    return amount / 2.47105; // ha to acre
  };

}

module.exports = new GrowthModel();