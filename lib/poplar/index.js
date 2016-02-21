var md5 = require('md5');
var extend = require('extend');
var events = require('events').EventEmitter;
var defaultConfig = require('./modelConfig');
var growthModel = require('poplar-3pg-model');
delete defaultConfig.weather;

function Model(ds, budget) {
  // growth profiles
  this.profiles = {};
  this.events = new events();

  this.on = function(e, fn) {
    this.events.on(e, fn);
  };

  this.fireUpdate = function(parcel) {
    this.events.emit('harvests-updated', {
      id : parcel.properties.PolyID,
      profileId : parcel.properties.ucd.modelProfileId,
      data : parcel.properties.ucd.harvests
    });
  };


  this.growAll = function() {
    ds.selectedParcels.forEach(this.grow.bind(this));
  };

  this.grow = function(parcel) {
    this.initProfile(parcel);
    var id = parcel.properties.ucd.modelProfileId;

    if( !id ) {
      console.log('Failed to generate growth profile!! '+id+', parcel: '+parcel.properties.PolyID);
      return;
    }

    var profile = this.profiles[id];

    if( profile.data ) {
      console.log('cached 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);
      this.setAmounts(parcel, profile.data);
      this.fireUpdate(parcel);
      return;
    }
    var config = profile.config;

    for( var key in config) {
      growthModel[key] = config[key];
    }
    growthModel.manage.datePlanted = new Date(config.manage.datePlanted);
    growthModel.manage.dateCoppiced = new Date(config.manage.dateCoppiced);
    growthModel.tree = growthModel.plantation.coppicedTree;

    var harvests = [];
    console.log('running 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);

    var t = new Date().getTime();
    try {
      growthModel.onHarvest = function(e) {
        harvests.push(e.data.WS);
      }.bind(this);

      var results = growthModel.run(168);
      harvests.push(results[results.length-1][31]);

      this.setAmounts(parcel, harvests);
      profile.data = harvests;
      this.fireUpdate(parcel);
    } catch(e) {
      debugger;
      console.log('Error growing poplar!');
      console.log(e);
      // the model will preform simple validation an throw errors if
      // inputs are is missing.
    }
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

    config.manage.irrigFrac = parcel.properties.IrrSuitabilityScore / 100;
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
    console.log('irrigFrac = '+(parcel.properties.IrrSuitabilityScore / 100)+', '+
                'acres = '+parcel.properties.GISAcres.toFixed(2)+', '+
                'suitable acres = '+(parcel.properties.PotentiallySuitPctOfParcel * 100).toFixed(0)+'%');
  };

  this.setAmounts = function(parcel, harvests) {
    var tmp = [];
    var total = 0;

    harvests.forEach(function(amount){
      var t = this.getHarvestAmount(parcel, amount);
      tmp.push(t);
      total += t;
    }.bind(this));

    var size = parcel.properties.GISAcres * parcel.properties.PotentiallySuitPctOfParcel;

    parcel.properties.ucd.harvest = {
      perAcreHarvests : extend(true, [], harvests),
      harvests : tmp,
      totalHarvest : total,
      growArea : size
    };

    this.displayParcelInfo(parcel);
    console.log(tmp.length+' harvests: '+tmp.join(', ')+' Mg, (total '+total+') on '+size.toFixed(2)+' acres.');
    console.log('$'+(24*total).toFixed()+' total, '+((24*total)/14).toFixed()+' per year, income @ $24 per Mg');
    console.log('$'+(((24*total)/14) - budget.getTotal()).toFixed(2)+' per year, net @ $'+budget.getTotal().toFixed(2)+' cost \n');

  };

  this.getHarvestAmount = function(parcel, amount) {
    var amountInAcres = amount * 2.47105;
    var size = parcel.properties.GISAcres;
    var amountSuitable = parcel.properties.PotentiallySuitPctOfParcel;

    var total = amountInAcres * size * amountSuitable;
    return parseFloat(total.toFixed(3));
  };
}


module.exports = Model;
