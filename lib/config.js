var config = {
  esriPracelUrl : 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer',
  ahbWeatherUrl : 'http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest',
  ahbServer : '',
  ahbBulkWeatherUrl : '/weather/get',
  ahbBulkSoilUrl : '/soil/get',
  budgets : {
    poplarBudgetId : '431159d7-8f98-469b-abbb-491005d96d4d',
    url : 'http://farmbudgets.org',
    commodity : 'poplar',
    authority : 'AHB'
  },
  monthsToRun : 240,
  indexeddb : {
    name : 'dst',
    version : 2
  },
  localdb : {
    /*
      key: object store name
      value: primary key for object store
    */
    stores : {
      soil : 'id',
      weather : 'id',
      growthProfiles : 'id',
      parcels : {
        key : 'properties.id',
        indexes : [{
          name : 'selected',
          key : 'properties.ucd.selected'
        }]
      }
    }
  }
};

module.exports = function() {
  return config;
};
