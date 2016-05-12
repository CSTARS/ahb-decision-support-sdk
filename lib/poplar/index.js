var md5 = require('md5');
var extend = require('extend');
var async = require('async');
var events = require('events').EventEmitter;
var defaultConfig = require('./modelConfig');
var monthsToRun = require('../config')().monthsToRun;
var logger = require('../log');
var growthModel = require('poplar-3pg-model');
delete defaultConfig.weather;

function Model(ds, budget) {
  // growth profiles
  this.profiles = {};
  this.events = new events();
  this.monthsToRun = monthsToRun;

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };

  // TODO: switch to async w/ 0ms timeout
  this.growAll = function(runWithDelay, callback) {
    if( typeof runWithDelay === 'function' ) {
      callback = runWithDelay;
      runWithDelay = false;
    }

    var c = 0;
    this.events.emit('harvests-start');

    async.eachSeries(
      ds.validParcels,
      function(parcel, next) {
        var responseCode = this.grow(parcel);
        c++;

        this.events.emit('harvests-updated', {
          id : parcel.properties.PolyID,
          profileId : parcel.properties.ucd.modelProfileId,
          data : parcel.properties.ucd.harvest,
          responseCode : responseCode,
          count : c,
          percent : Math.floor((c / ds.validParcels.length)*100)
        });

        if( responseCode === 2 && runWithDelay ) {
          setTimeout(function(){
            next();
          }.bind(this), 100);
        } else {
          //setTimeout(function(){
            next();
          //}.bind(this), 0);
        }

      }.bind(this),
      function(err) {
        if( callback ) callback();

        this.events.emit('harvests-end');
      }.bind(this)
    );
  };

  this.grow = function(parcel) {
    this.initProfile(parcel);
    var id = parcel.properties.ucd.modelProfileId;

    if( !id ) {
      logger.log('Failed to generate growth profile!! '+id+', parcel: '+parcel.properties.PolyID);
      return -1;
    }

    var profile = this.profiles[id];

    if( profile.data ) {
      logger.log('cached 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);
      this.setAmounts(parcel, profile.data, profile.growthError);
      return 1;
    }
    var config = profile.config;

    for( var key in config) {
      growthModel[key] = config[key];
    }
    growthModel.manage.datePlanted = new Date(config.manage.datePlanted);
    growthModel.manage.dateCoppiced = new Date(config.manage.dateCoppiced);
    // growthModel.tree = growthModel.plantation.coppicedTree;

    var harvests = [];
    logger.log('running 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);

    var t = new Date().getTime();
    try {
      growthModel.onHarvest = function(e) {
        harvests.push(e.data.WS);
      }.bind(this);

      var results = growthModel.run(this.monthsToRun);
      harvests.push(results[results.length-1][31]);

      if( isNaN(harvests[0]) ) {
        profile.growthError = true;
      } else {
        profile.growthError = false;
      }

      this.setAmounts(parcel, harvests, profile.growthError);
      profile.data = harvests;
      profile.allData = results;
      profile.totalIrrigation = results[results.length-1][14] / 1000;
      
      //this.fireUpdate(parcel);
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

  this.initProfile = function(parcel) {
    if( parcel.properties.ucd.modelProfileId ) {
      return;
    }

    var config = extend(true, {}, defaultConfig);
    var id = parcel.properties.PolyID;

    var weather = ds.weather[id];
    if( !weather ) {
      return;
    }
    config.weather = {};
    for(var i = 0; i < weather.length; i++ ) {
      config.weather[i] = weather[i];
    }

    if( parcel.properties.ucd.cropInfo.pasture ) {
      config.manage.irrigFrac = 0;
    } else {
      config.manage.irrigFrac = 1;
    }
    
    config.soil = ds.soil[id];

    var profileId = md5(JSON.stringify(config));
    parcel.properties.ucd.modelProfileId = profileId;
    if( this.profiles[profileId] ){
      return;
    }

    this.profiles[profileId] = {
      config : config,
      data : null
    };
  };


  this.displayParcelInfo = function(parcel) {
    logger.log('acres = '+parcel.properties.GISAcres.toFixed(2)+', '+
                'suitable acres = '+(parcel.properties.PotentiallySuitPctOfParcel * 100).toFixed(0)+'%');
  };

  this.setAmounts = function(parcel, harvests, hasError) {
    var tmp = [];
    var total = 0;

    harvests.forEach(function(amount){
      var t = this.getHarvestAmount(amount);
      tmp.push(t);
      total += t;
    }.bind(this));

    var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;

    parcel.properties.ucd.harvest = {
      harvests : tmp,
      totalHarvest : total * size,
      growArea : size,
      growthError : hasError,
      years : this.monthsToRun / 12
    };

    this.displayParcelInfo(parcel);
    logger.log(tmp.length+' harvests: '+tmp.join(', ')+' Mg, (total '+total+') on '+size.toFixed(2)+' acres.');
    logger.log('$'+(24*total).toFixed()+' total, '+((24*total)/14).toFixed()+' per year, income @ $24 per Mg');
    //logger.log('$'+(((24*total)/14) - budget.getTotal()).toFixed(2)+' per year, net @ $'+budget.getTotal().toFixed(2)+' cost \n');

  };

  this.getHarvestAmount = function(amount) {
    var amountInAcres = amount / 2.47105; // ha to acre
    return amountInAcres;
  };
}


module.exports = Model;
