var request = require('superagent');
var config = require('../config')();
var async = require('async');

function run(lat, lng, radius, parcelCollection, callback) {
  request
    .get(config.ahbServer+'/parcelCache/get')
    .query({
      lat : lat,
      lng : lng,
      radius : radius
    })
    .end(function(err, resp){
      if( err ) {
        console.log(err);
        console.log(resp);
      }

      var tmp = resp.text.trim().split('\n');
      var parcels = [];
      tmp.forEach((parcel) => {
        if( !parcel ) return;
        parcels.push(JSON.parse(parcel));
      });

      parcelCollection.addMany(parcels);
      callback();
    });
}

module.exports = run;