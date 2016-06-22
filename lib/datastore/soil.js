var async = require('async');
var localdb = require('../localdb');

module.exports = function(DataStore) {
  DataStore.prototype.getSoil = function(callback) {
    this.events.emit('soil-update-start');

    localdb.clear('soil');

    for( var key in this.afriPxs ) {
       query.push(this.afriPxs[key].join(','));
    }

    this.rest.soil.getAll(query, function(err, soil){
      var msg = {};

      if( err ) {
        msg.error = true;
        msg.message = err;
      } else {
        msg.success = true;

        var data = [];
        for( var i = 0; i < soil.length; i++ ) {
          data.push({
            id : pxLookup[i],
            data : JSON.stringify(soil[i])
          });
        }

        localdb.addMany('soil', data, () => {
          this.events.emit('soil-update-end', msg);
          callback();
        });
      }


    }.bind(this));

  };
};
