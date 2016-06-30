var query = require('../rest/refinery');
var Model = require('../models/refinery');

function RefineryCollection() {
  this.selected = null;

  this.select = function(name) {
    refineryQuery.getAll((refineries) => {
      refineries.forEach((r) => {
        if( r.name === name ) {
          this.selected = new Model(r);
        }
      });
    });
  }

}

