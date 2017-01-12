var extend = require('extend');
var md5 = require('md5');
var localdb = require('../../localdb');
var weatherCollection = require('../weather');
var soilCollection = require('../soil');
var parcelCollection = require('../parcels');
var events = require('../../events');

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

  this.clear = function() {
    localdb.clear(DB_COLLECTION_NAME);
  }


  this.cleanup = function() {
    soilCollection.clear();
    weatherCollection.clear();
  }

  this.getAll = function() {
    return localdb.getAll(DB_COLLECTION_NAME);
  }

  this.get = function(id) {
    return localdb.get(DB_COLLECTION_NAME, id);
  }

  this.update = function(growthProfile) {
    localdb.put(DB_COLLECTION_NAME, growthProfile);
  }

  this.initProfile = function(parcel) {
    if( parcel.properties.ucd.modelProfileId ) {
      return this.get(parcel.properties.ucd.modelProfileId);
    }

    var config = extend(true, {}, this.trees[this.selectedTree]);

    return this._loadProfileWeather(config, parcel);
  };



  this._loadProfileWeather = function(config, parcel) {
    var px = weatherCollection.get(parcel.properties.ucd.afriPx);
    if( !px ) return;

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

    return this._loadProfileSoil(config, parcel);
  }




  this._loadProfileSoil = function(config, parcel) {
    var px = soilCollection.get(parcel.properties.ucd.afriPx);
    if( !px ) return;

    config.soil = JSON.parse(px.data);
    return this._setProfile(config, parcel);
  }



  this._setProfile = function(config, parcel, next) {
    var profileId = md5(JSON.stringify(config));
    parcel.properties.ucd.modelProfileId = profileId;

    // update parcel w/ new modelProfileId
    parcelCollection.update(parcel);
    
    // make sure we didn't already save this profile
    var profile = localdb.get(DB_COLLECTION_NAME, profileId);
    if( profile ) return profile;

    var profile = {
      id : profileId,
      config : config,
      data : null
    }

    // save profile if new
    localdb.add(DB_COLLECTION_NAME, profile);
    return profile;
  }

  parcelCollection.inject(this);

  events.on('get-growth-time', (e) => {
    e.handler(this.years);
  });

  events.on('get-selected-tree-name', (e) => {
    e.handler(this.selectedTree);
  });

  events.on('get-growth', (e) => {
    e.handler(this.get(e.id));
  });

}

module.exports = new GrowthModelCollection();