var md5 = require('md5');
var extend = require('extend');
var defaultConfig = require('./modelConfig');
var growthModel = require('poplar-3pg-model');
delete defaultConfig.weather;

function Model(ds) {
  // growth profiles
  this.profiles = {};

  this.growAll = function() {
    var parcels = ds.parcels;

    parcels.forEach(function(parcel) {
      if( parcel.properties.modelProfileId ) {
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

      config.soil = ds.soil[id];

      var profileId = md5(JSON.stringify(config));
      parcel.properties.modelProfileId = profileId;
      if( this.profiles[profileId] ){
        return;
      }

      this.profiles[profileId] = {
        config : config,
        data : null
      };
    }.bind(this));

    parcels.forEach(this.grow.bind(this));
  };

  this.grow = function(parcel) {
    var id = parcel.properties.modelProfileId;
    if( !id ) {
      return;
    }

    var profile = this.profiles[id];

    if( profile.data ) {
      console.log('cached 3pg model for profile: '+id+', parcel: '+parcel.properties.PolyID);
      console.log(profile.data.length+' harvests: '+profile.data.join(', ')+' [Mg/ha]\n');
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
      };

      var results = growthModel.run(168);
      harvests.push(results[results.length-1][31]);
      console.log(harvests.length+' harvests: '+harvests.join(', ')+' [Mg/ha]\n'+(new Date().getTime()-t)+'ms\n');
      profile.data = harvests;
    } catch(e) {
      console.log(e);
    // the model will preform simple validation an throw errors if
    // inputs are is missing.
    }
  };
}


module.exports = Model;
