var extend = require('extend');
var md5 = require('md5');
var localdb = require('../../localdb');
var weatherCollection = require('../weather');
var soilCollection = require('../soil');
var parcelCollection = require('../parcels');

var defaultConfig = require('./modelConfig');
var defaultConfigBest = require('./modelConfigBest');
var monthsToRun = require('../../config')().monthsToRun;

delete defaultConfig.weather;
delete defaultConfigBest.weather;

var DB_COLLECTION_NAME = 'growthProfiles';

function GrowthModelCollection() {
  this.trees = {
    Generic : defaultConfig,
    'Pont Beaupre' : defaultConfigBest
  }

  this.selectedTree = 'Generic';
  this.monthsToRun = monthsToRun;
  this.years = monthsToRun / 12;

  this.clear = function(callback) {
    localdb.clear(DB_COLLECTION_NAME, callback);
  }


  this.cleanup = function() {
    soilCollection.clear();
    weatherCollection.clear();
  }



  this.get = function(id, callback) {
    localdb.get(DB_COLLECTION_NAME, id, callback);
  }



  this.update = function(growthProfile, callback) {
    localdb.put(DB_COLLECTION_NAME, growthProfile, callback);
  }



  this.initProfile = function(parcel, callback) {
    if( parcel.properties.ucd.modelProfileId ) {
      return next();
    }

    var config = extend(true, {}, this.trees[this.selectedTree]);

    this._loadWeather(config, parcel, callback);
  };



  this._loadWeather = function(config, parcel, next) {
    weatherCollection.get(parcel.properties.ucd.afriPx, (px) => {
      if( !px ) {
        return next();
      }
      var weather = JSON.parse(px.data);

      config.weather = {};
      for(var i = 0; i < weather.length; i++ ) {
        config.weather[i] = weather[i];
      }

      // Set irrigation for land type
      // TODO: move this
      if( parcel.properties.ucd.cropInfo.pasture ) {
        config.manage.irrigFrac = 0;
      } else {
        config.manage.irrigFrac = 1;
      }

      this._loadSoil(config, parcel, next)
    });
  }




  this._loadSoil = function(config, parcel, next) {
    soilCollection.get(parcel.properties.ucd.afriPx, (px) => {
        if( px ) {
          config.soil = JSON.parse(px.data);
          this._setProfile(config, parcel, next);
        }
    }, next);
  }




  this._setProfile = function(config, parcel, next) {
    var profileId = md5(JSON.stringify(config));
    parcel.properties.ucd.modelProfileId = profileId;

    // update parcel w/ new modelProfileId
    parcelCollection.update(parcel, () => {
      // make sure we didn't already save this profile
      localdb.get(DB_COLLECTION_NAME, profileId, (profile) => {
        if( profile ){
          return next(profile);
        }

        var profile = {
          id : profileId,
          config : config,
          data : null
        }

        // save profile if new
        localdb.add(DB_COLLECTION_NAME, profile, () => {
          next(profile);
        });

      });
    });

  }

  parcelCollection.inject(this);

}

module.exports = new GrowthModelCollection();