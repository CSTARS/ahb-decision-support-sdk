---
layout: page
title: Growth Profile
---


The growth profile is the config and result summary from a parcels 3PG Model
run.  The profile ID is a MD5 of the configuration.  This allows parcels to reuse
growth profiles that have matching soil and weather conditions.

Whant to know more about this model and the code behind it?
Check out [https://github.com/CSTARS/poplar-3pg-model](https://github.com/CSTARS/poplar-3pg-model)

## Structure

```js

{
  // growth profile id.  MD5 of config
  id : "",

  // the config is complex.  Please see a default config 
  // here: https://github.com/CSTARS/ahb-decision-support-sdk/blob/master/lib/collections/growthProfiles/modelConfig.js
  // for full detauls.  For more information about the 3pg poplar growth model
  // please see the repo here: https://github.com/CSTARS/poplar-3pg-model
  config : {
    // from default config
    manage : {},
    // from default config
    plantation : {},
    // from soil collection
    soil : {},
    // from weather collection
    weather : {}
  },

  // summary of results from 3PG model
  data : {
    // array containing Mg / Acre of poplar for each harvest.  This is converted from Ha to Acre.
    harvests : [Number],
    // total amount of poplar harvested per acre over crop lifetime (Mg)
    // summation of harvests array.  Mg / Acre
    totalPerAcre: Number,
    // crop life (number of years harvested)
    years : Number
  },

  // did the 3PG model throw an error
  growthError : Boolean,

  // CumIrrig parameter, crop lifetime (meters/mon)
  totalIrrigation : Number,

  // Stem biomass (Mg/ha) for every month of crops lifetime
  // Note, in data.harvests, these values are stored in Acres not Ha.
  ws : [Number]
}
```

Note.  Due to memory contraints we throw out most of the data returned from the 3PG model.
Really only WS and the last CumIrrig values are kept.