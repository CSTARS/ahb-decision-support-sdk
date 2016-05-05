var sdk = require('./lib');

var ll = [40.600445, -122.204414];
var radius = 40*1000;
var poplarPrice = 24;

var t = new Date().getTime();

sdk.datastore.poplarPrice = poplarPrice;

console.log('Finding parcels '+ll.join(',')+' @ '+(radius/1000)+'km radius ...\n');
sdk.datastore.getParcels(ll[0], ll[1], radius, function(err, parcels){
  if( err ) {
    console.log(err);
  }

  console.log('Retrieving weather...');
  sdk.datastore.getWeather(function(weather){
    console.log('Retrieving soil...');
    sdk.datastore.getSoil(function(soil){

      console.log('Looking up transportation routes...');
      sdk.datastore.getTransportation(function(){

        console.log('Looking up crop type/yield for parcels...');
        sdk.datastore.getCropTypes(function(){

          console.log('Loading farm budget for poplar...');
          sdk.budget.load(function(){
            sdk.poplarModel.growAll(function(){

              sdk.datastore.selectParcels();

              console.log('\nDone. '+sdk.datastore.selectedParcels.length+' parcels. '+
                Math.floor((sdk.datastore.selectedParcels.length / sdk.datastore.parcels.length)*100) +
                '% adoption. @$'+poplarPrice+'/Mg '+(new Date().getTime()-t)+'ms');
            });


          });
        });
      });
    });
  });
});
