var optimize = require('./optimize');

function RefineryModel(data) {
    this.ROI = 0.10;
    this.years = 20;
    this.poplarPrice = 24;

    this.update = function() {
      this.setCRF();
      this.setMWP();
    }

    this.optimize = optimize;

    this.setCRF = function(roi, life) {
        this.crf = (this.ROI * Math.pow(1+this.ROI, this.year)) / (Math.pow(1+this.ROI, this.years) - 1); 
    }

    // maximum willingness to pay 
    this.setMWP = function(productPrice, productYield, crf, capitalCost, operatingCost, feedstock) {
        this.maxWillingToPay = (this.product.price * this.yield.value) - ((this.crf * this.capitalCost + this.operatingCost.value) / this.feedstockCapacity.value);
    }

    for( var key in data ) {
      this[key] = data;
    } 

    this.update();
}

module.exports = RefineryModel;