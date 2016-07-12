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
      factored : {},
      currentValues : {}
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
      for( var key in resp ) {
        this.priceYield.data[key.toLowerCase()] = resp[key];
      }

      updateCurrentPriceYield(this.priceYield);

      events.emit('crop-priceyield-update-end');
      callback();
    });
  };

  this.setPriceAndYield = function(type) {
    for( var crop in this.priceYield.factored ) {
      this.priceYield.currentValues[crop] = extend(true, {}, this.priceYield.factored[crop][type]);
    }
  };

  this.getCropPriceAndYield = function(crop) {
    crop = crop.toLowerCase();
    if( !this.priceYield.currentValues[crop] ) {
      return returnPriceError();
    }
    return this.priceYield.currentValues[crop];
  };
}

function updateCurrentPriceYield(priceYield) {
  priceYield.factored = {};

  for( var crop in priceYield.data ) {

    var average = getAverage(priceYield.data[crop]);

    priceYield.factored[crop] = {
      max : getMax(priceYield.data[crop]),
      min : getMin(priceYield.data[crop]),
      average : average
    };

    priceYield.currentValues[crop] = extend(true, {}, average);
  }
};

function getMax(data) {
  var result = getDefaultObject();

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
  var result = getDefaultObject();
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
  var result = getDefaultObject();
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

function getDefaultObject() {
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

function returnPriceError() {
  var obj = getDefaultObject();
  obj.error = true;
  return obj;
}

module.exports = new CropCollection();