function getPriceAndYield(datastore, crop, fips) {
  if( !datastore.cropPriceYield[crop] ) {
    return returnPriceError();
  }

  var state = fips.substring(0, 2);

  if( datastore.cropPriceYield[crop][fips] ) {
    return datastore.cropPriceYield[crop][fips];
  }
  if( datastore.cropPriceYield[crop][state] ) {
    return datastore.cropPriceYield[crop][state];
  }

  return returnPriceError();
}

function returnPriceError() {
  return {
    price : {
      price : 0,
      unit : 'Error'
    },
    yield : {
      irrigated: 0,
      'non-irrigated': 0,
      unspecified: 0,
      unit: 'Error'
    },
    error : true
  };
}

module.exports =  {
  getPriceAndYield : getPriceAndYield
};
