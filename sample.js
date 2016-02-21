var sdk = require('./lib');

var ll = [40.600445, -122.204414];
var radius = 5000;

var t = new Date().getTime();

console.log('Finding parcels...');
sdk.datastore.getParcels(ll[0], ll[1], radius, function(err, parcels){
  console.log('Retrieving weather...');
  sdk.datastore.getWeather(function(weather){
    console.log('Retrieving soil...\n');
    sdk.datastore.getSoil(function(soil){


      console.log('Loading farm budget for poplar...\n');
      sdk.budget.load(function(){
        sdk.model.growAll();
        console.log('\nDone. '+sdk.datastore.parcels.length+' parcels. '+(new Date().getTime()-t)+'ms');
      });
    });
  });
});
