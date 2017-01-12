var extend = require('extend');

var events = require('../events');
var query = require('../rest/crops');

function CropCollection() {

  this.swapTypes = {};
  this.fips = {};

  this.priceYield =  {
    data : {},
    factored : {},
    currentValues : {}
  };

  this.clear = function() {
    this.swapTypes = {};
    this.fips = {};

    this.priceYield =  {
      data : {},
      // factored : {},
      // currentValues : {}
    };
  }

  // added from the parcels collection when parcels are loaded
  this.addSwapType = function(type) {
    this.swapTypes[type] = true;
  }

  // added from the parcels collection when parcels are loaded
  this.addFips = function(code) {
    this.fips[code] = true;
  }

  this.load = function(callback) {
    events.emit('crop-priceyield-update-start');

    var q = {
      swap : Object.keys(this.swapTypes),
      fips : Object.keys(this.fips),
    };

    query.getPriceAndYield(q, (err, resp) => {
      if( err ) {
        events.emit('crop-priceyield-update-end');
        if( callback ) callback(err);
        return;
      }



      this.priceYield.data = {};
      var cropInfo;
      for( var crop in resp ) {
        cropInfo = resp[crop];

        for( var fips in cropInfo ) {
          if( !cropInfo[fips].yield.irrigated ) {
            console.warn(`Setting ${crop}@${fips} irrigated yield to unspecified value`);
            cropInfo[fips].yield.irrigated = cropInfo[fips].yield.unspecified;
          }
          if( !cropInfo[fips].yield['non-irrigated'] ) {
            console.warn(`Setting ${crop}@${fips} non-irrigated yield to unspecified value`);
            cropInfo[fips].yield['non-irrigated'] = cropInfo[fips].yield.unspecified;
          }
        }

        this.priceYield.data[crop.toLowerCase()] = resp[crop];
      }

      // updateCurrentPriceYield(this.priceYield);

      events.emit('crop-priceyield-update-end');
      callback();
    });
  };

  // TODO: REMOVE
  this.setPriceAndYield = function(type) {
    for( var crop in this.priceYield.factored ) {
      this.priceYield.currentValues[crop] = extend(true, {}, this.priceYield.factored[crop][type]);
    }
  };

  this.getCropPriceAndYield = function(crop, fips) {
    crop = crop.toLowerCase();

    if( !this.priceYield.data[crop] ) {
      return returnPriceError(crop, fips);
    }

    if( this.priceYield.data[crop][fips]  ) {
      return this.priceYield.data[crop][fips]
    } else if( this.priceYield.data[crop][fips.substring(0,2)]  ) {
      return this.priceYield.data[crop][fips.substring(0,2)];
    } else if( this.priceYield.data[crop]  ) {
      var first = Object.keys(this.priceYield.data[crop])[0];
      console.warn(`Unable to find crop price/yield data for: ${crop}, ${fips}.  Using fips: ${first} instead`);
      return this.priceYield.data[crop][first];
    }

    return returnPriceError(crop, fips);
  };

  events.on('get-crop-price-yield', (e) => {
    e.handler(this.getCropPriceAndYield(e.crop, e.fips));
  });

  events.on('set-price-yield-value', (e) => {
    this.priceYield.currentValues[e.crop][e.type][e.type] = e.value;
  });
}

function getDefaultObject() {
  return {
    price : {
      price : 0,
      unit : 'Error'
    },
    yield : {
      'non-irrigated' : 0,
      irrigated : 0,
      unit: 'Error'
    },
    error : true
  };
}

function returnPriceError(crop, fips) {
  console.error(`Unable to find crop price/yield data for: ${crop}, ${fips}`);
  var obj = getDefaultObject();
  obj.error = true;
  return obj;
}

module.exports = new CropCollection();