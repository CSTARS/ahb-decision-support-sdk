var optimize = require('./optimize');
var utils = require('./utils');

function RefineryModel(data, collection) {
    this.ROI = 0.10;
    this.years = 20;
    this.poplarPrice = 24;

    this.update = function() {
      this.setCRF();
      this.setMWP();
    }

    this.optimize = function(callback) {
        optimize(collection, callback);
    }

    this.setCRF = function(roi, life) {
        this.crf = (this.ROI * Math.pow(1+this.ROI, this.years)) / (Math.pow(1+this.ROI, this.years) - 1); 
    }

    // maximum willingness to pay 
    this.setMWP = function(productPrice, productYield, crf, capitalCost, operatingCost, feedstock) {
        this.maxWillingToPay = (this.product.price * this.yield.value) - ((this.crf * this.capitalCost + this.operatingCost.value) / this.feedstockCapacity.value);
    }

    this.utils = utils;

    for( var key in data ) {
      this[key] = data[key];
    } 

    this.update();
}

module.exports = RefineryModel;