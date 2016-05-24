var md5 = require('md5');
var extend = require('extend');
var async = require('async');

module.exports = function(DataStore) {
  DataStore.prototype.getCrops = function(callback) {
    this.events.emit('crops-update-start');

    this.validParcels = [];
    this.errorFetchingCropTypes = false;

    var groups = [];
    var len = Math.ceil(this.allParcels.length / 4);
    var group = [];

    for( var i = 0; i < this.allParcels.length; i++ ) {
      group.push(this.allParcels[i]);
      if( group.length === len ) {
        groups.push(group);
        group = [];
      }
    }
    groups.push(group);

    var notFound = 0;
    var duplicates = 0;
    var lookup = {};
    var c = 0;

    async.eachSeries(
      groups,
      function(parcels, next) {
        c++;
        this.rest.crops.getAll(parcels, function(err, resp){
          if( err || resp.error ) {
            this.errorFetchingCropTypes = true;
            this.events.emit('crops-update-updated',{percent: Math.floor((c/4)*100)});
            return next();
          }

          resp.forEach(function(item){
            if( lookup[item.id] ) {
              duplicates++;
            } else {
              lookup[item.id] = item;
            }
          });

          this.events.emit('crops-update-updated',{percent: Math.floor((c/4)*100)});
          next();
        }.bind(this));

      }.bind(this),
      function(){
        this.allParcels.forEach(function(parcel){
          var geom = parcel.geometry;
          var id = md5(JSON.stringify({type: geom.type, coordinates: geom.coordinates}));
          if( !lookup[id] ) {
            notFound++;
          } else {
            var prop = parcel.properties.ucd;
            prop.cropInfo = lookup[id];
            prop.state = lookup[id].state;

            var valid = true;
            for( var j = 0; j < prop.cropInfo.swap.length; j++ ) {
              if( prop.cropInfo.swap[j].toLowerCase() === 'n/a' ) {
                //valid = false;
                //break;
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
                continue;
              }

              if( prop.cropInfo.swap[j] === 'Grassland/Pasture' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
              }
              /*if( prop.cropInfo.swap[j] === 'N/A' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
                prop.cropInfo.pasture = true;
              }*/
              if( prop.cropInfo.swap[j] === 'Grass Hay' ) {
                prop.cropInfo.swap[j] = 'Grass Haylage';
              }
            }

            if( valid ) {
              this.validParcels.push(parcel);
            }
          }
        }.bind(this));

        console.log('notFound='+notFound+' duplicates='+duplicates);

        if( callback ) callback();
        this.events.emit('crops-update-end');
      }.bind(this)
    );


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

      this.priceYield.data = resp;
      this.updateCurrentPriceYield();

      this.events.emit('crop-priceyield-update-end');
      callback();
    }.bind(this));
  };

  DataStore.prototype.updateCurrentPriceYield = function() {
    this.priceYield.factored = {};

    for( var crop in this.priceYield.data ) {

      var average = getAverage(this.priceYield.data[crop]);

      this.priceYield.factored[crop] = {
        max : getMax(this.priceYield.data[crop]),
        min : getMin(this.priceYield.data[crop]),
        average : average
      };

      this.priceYield.currentValues[crop] = extend(true, {}, average);
    }
  };

  DataStore.prototype.setPriceAndYield = function(type) {
    for( var crop in this.priceYield.factored ) {
      this.priceYield.currentValues[crop] = extend(true, {}, this.priceYield.factored[crop][type]);
    }
  };

  DataStore.prototype.getPriceAndYield = function(crop) {
    if( !this.priceYield.currentValues[crop] ) {
      return returnPriceError();
    }
    return this.priceYield.currentValues[crop];
  };
};



function getMax(data) {
  var result = returnPriceError();

  for( var key in data ) {
    if( data[key].price.price > result.price.price ) {
      result.price.price = data[key].price.price;
      result.price.unit = data[key].price.unit;
    }

    for( var type in data[key].yield ) {
      if( typeof data[key].yield[type] !== 'number' ) {
        continue;
      }
      if( data[key].yield[type] > result.yield.yield ) {
        result.yield.yield = data[key].yield[type];
        result.yield.unit = data[key].yield.unit;
      }
    }
  }

  return result;
}

function getMin(data) {
  var result = returnPriceError();
  result.price.price = 9999;
  result.yield.yield = 9999;

  for( var key in data ) {
    if( data[key].price.price < result.price.price ) {
      result.price.price = data[key].price.price;
      result.price.unit = data[key].price.unit;
    }

    for( var type in data[key].yield ) {
      if( typeof data[key].yield[type] !== 'number' ) {
        continue;
      }
      if( typeof data[key].yield[type] === 0 ) {
        continue;
      }
      if( data[key].yield[type] < result.yield.yield ) {
        result.yield.yield = data[key].yield[type];
        result.yield.unit = data[key].yield.unit;
      }
    }
  }

  return result;
}

function getAverage(data) {
  var result = returnPriceError();
  var ycount = 0, pcount = 0;

  for( var key in data ) {
    result.price.price += data[key].price.price;
    result.price.unit = data[key].price.unit;
    pcount++;

    for( var type in data[key].yield ) {
      if( typeof data[key].yield[type] !== 'number' ) {
        continue;
      }
      result.yield.yield += data[key].yield[type];
      result.yield.unit = data[key].yield.unit;
      ycount++;
    }
  }

  result.price.price = parseFloat((result.price.price / pcount).toFixed(2));
  result.yield.yield = parseFloat((result.yield.yield / ycount).toFixed(2));

  return result;
}

function returnPriceError() {
  return {
    price : {
      price : 0,
      unit : 'Error'
    },
    yield : {
      yield : 0,
      unit: 'Error'
    },
    error : true
  };
}
