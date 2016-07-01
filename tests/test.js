var sdk = require('../lib/index.js');
sdk.config.ahbServer = 'http://localhost:8000';

var options = {
    lat : 40.5806,
    lng :  -122.3877,
    radius : 20*1000,
    refinery : 'Acetic Acid',
    routeGeometry : false
}

sdk.controllers.refinery.model(options, () => {
  console.log('done');
});