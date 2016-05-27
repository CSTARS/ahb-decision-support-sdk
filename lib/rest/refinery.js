
var cache = {};
var request;

var adoption = require('../adoption/refinery');
var ROI = 0.10;
var YEARS = 20;

var stub = [
{
    name : 'Acetic Acid',
    capitalCost : 240000000,
    capitalBreakdown : [0.08, 0.6, 0.3],
    operatingCost: {
        value : 30000000,
        units : '$ / Year'
    },
    yield : {
        value : 0.546,
        units : 'tons / dry ton'
    },
    product : {
        name : 'Acetic Acid',
        price : 600,
        units : '$ / ton'
    },
    feedstockCapacity : {
        value : 250000,
        units : 'dry tons / Year'
    }
},
{
    name : '100 MGY Jet Fuel',
    capitalCost : 764300000,
    capitalBreakdown : [0.08, 0.6, 0.3],
    operatingCost: {
        value : 169000000,
        units : '$ / Year'
    },
    yield : {
        value : 80,
        units : 'gallons / dry ton'
    },
    product : {
        name : 'Jet Fuel',
        price : 4,
        units : '$ / Gallon'
    },
    feedstockCapacity : {
        value : 1250000,
        units : 'dry tons / Year'
    }
},
{
    name : '100 MGY Jet Fuel Retrofit',
    capitalCost : 535000000,
    capitalBreakdown : [0.08, 0.6, 0.3],
    operatingCost: {
        value : 169000000,
        units : '$ / Year'
    },
    yield : {
        value : 80,
        units : 'gallons / dry ton'
    },
    product : {
        name : 'Jet Fuel',
        price : 4,
        units : '$ / Gallon'
    },
    feedstockCapacity : {
        value : 1250000,
        units : 'dry tons / Year'
    }
}
];

stub.forEach((r) => {
    r.crf = adoption.crf(ROI, YEARS);
    r.maxWillingToPay = adoption.mwp(r.product.price, r.yield.value, r.crf, r.capitalCost, r.operatingCost.value, r.feedstockCapacity.value);
});


module.exports = function(r) {
  request = r;

  return {
    getAll : getAll
  };
};

function getAll(callback) {
    callback(stub);
}