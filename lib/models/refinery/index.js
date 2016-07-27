var optimize = require('./optimize');
var utils = require('./utils');

function RefineryModel(data, collection, initialRor) {
    this.ROR = initialRor || 0.10;
    this.years = 20;
    this.poplarPrice = 24;

    this.update = function() {
      this.setCRF();
      this.setMWP();
    }

    this.setRor = function(ror) {
        this.ROR = ror;
        this.update();
    }

    this.optimize = function(options, callback) {
        optimize(collection, options, callback);
    }

    this.setCRF = function() {
        //this.crf = (this.ROI * Math.pow(1+this.ROI, this.years)) / (Math.pow(1+this.ROI, this.years) - 1); 
        this.crf = (this.ROR * Math.pow(1+this.ROR, this.years)) / (Math.pow(1+this.ROR, this.years) - 1); 
    }

    // maximum willingness to pay 
    this.setMWP = function(productPrice, productYield, crf, capitalCost, operatingCost, feedstock) {
        this.maxWillingToPay = this.product.price * this.yield.value - (this.crf * this.capitalCost + this.operatingCost.value) / this.feedstockCapacity.value;
        this.maxWillingToPay = parseFloat(this.maxWillingToPay.toFixed(2));
    }

    // get current ROI based on poplar price
    this.currentRoi = function(poplarYield) {
        var presentValue = 0, income;

        // sum the incomes and calculate years present value
        for( var year = 0; year < this.years; year++ ) {
            presentValue += refineryRevenue(year, poplarYield, this) * Math.pow(1+this.ROR, year-1);
        }

        // now add capitalCost back in
        presentValue += this.capitalCost;

        return {
            roi : (Math.pow(presentValue/this.capitalCost, 1/20) - 1) * 100,
            presentValue : presentValue
        }
    }

    this.utils = utils;

    for( var key in data ) {
      this[key] = data[key];
    } 

    this.update();
}

function refineryRevenue(year, poplarYield, refinery) {
    var capitalCost = (year === 0) ? refinery.capitalCost : 0;
    var actualYield = poplarYield ? poplarYield : refinery.feedstockCapacity.value;

    var income = poplarYield * refinery.yield.value * refinery.product.price;
    var cost = capitalCost + refinery.operatingCost.value + (refinery.poplarPrice * actualYield);
    return income - cost;
}


module.exports = RefineryModel;