var config = {
  esriPracelUrl : 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer',
  ahbWeatherUrl : 'http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest',
  ahbBulkWeatherUrl : '/weather/get',
  ahbBulkSoilUrl : '/soil/get',
  budgets : {
    url : 'http://farmbudgets.org',
    commodity : 'poplar',
    authority : 'AHB'
  },
  monthsToRun : 240
};

module.exports = function() {
  return config;
};
