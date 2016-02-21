var config = {
  esriPracelUrl : 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer',
  ahbWeatherUrl : 'http://alder.bioenergy.casil.ucdavis.edu:8080/vizsource/rest'
};

module.exports = function() {
  return config;
};
