var md5 = require('md5');

module.exports = function(DataStore) {
  DataStore.prototype.getCrops = function(callback) {
    this.events.emit('crops-update-start');

    this.validParcels = [];
    this.rest.crops.getAll(this.allParcels, function(err, resp, geoms){
      if( err ) {
        this.events.emit('crops-update-end');
        if( callback ) callback(err);
        return;
      }

      var notFound = 0;
      var duplicates = 0;

      var lookup = {};
      resp.forEach(function(item){
        if( lookup[item.id] ) {
          duplicates++;
        } else {
          lookup[item.id] = item;
        }
      });

      geoms.forEach(function(geom){
        var id = md5(JSON.stringify({type: geom.type, coordinates: geom.coordinates}));
        if( !lookup[id] ) {
          notFound++;
        }
      });

      console.log('notFound='+notFound+' duplicates='+duplicates);

      //var grassTypes = ['Grass Hay','Grass Haylage'];
      var grassTypes = ['Grass Haylage'];

      var prop;
      for( var i = 0; i < resp.length; i++ ) {
        if( i >= this.allParcels.length ) {
          break; // hack
        }
        prop = this.allParcels[i].properties.ucd;
        prop.cropInfo = resp[i];
        prop.state = resp[i].state;

        var valid = true;
        for( var j = 0; j < prop.cropInfo.swap.length; j++ ) {
          if( prop.cropInfo.swap[j].toLowerCase() === 'n/a' ) {
            valid = false;
            break;
          }
          if( prop.cropInfo.swap[j] === 'Grassland/Pasture' ) {
            prop.cropInfo.swap[j] = 'Grass Haylage';
          }
          if( prop.cropInfo.swap[j] === 'Grass Hay' ) {
            prop.cropInfo.swap[j] = 'Grass Haylage';
          }
        }

        if( valid ) {
          this.validParcels.push(this.allParcels[i]);
        }
      }

      if( callback ) callback();
      this.events.emit('crops-update-end');
    }.bind(this));
  };

  DataStore.prototype.getCropPriceAndYield = function(callback) {
    this.events.emit('crop-priceyield-update-start');

    var query = {
      swap : [],
      fips : []
    };

    this.validParcels.forEach(function(parcel){
      var cropInfo = parcel.properties.ucd.cropInfo;
      cropInfo.swap.forEach(function(swap){
        if( query.swap.indexOf(swap) === -1 ) {
          query.swap.push(swap);
        }
      });

      if( query.fips.indexOf(cropInfo.fips) === -1 ) {
        query.fips.push(cropInfo.fips);
      }
    });

    this.rest.crops.getPriceAndYield(query, function(err, resp){
      if( err ) {
        this.events.emit('crop-priceyield-update-end');
        if( callback ) callback(err);
        return;
      }

      this.cropPriceYield = resp;

      this.events.emit('crop-priceyield-update-end');
      callback();
    }.bind(this));
  };
};
