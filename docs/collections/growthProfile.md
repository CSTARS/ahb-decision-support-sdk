---
layout: page
title: Growth Profile Collection
---

The Growth Profile collection stores all parcels growth profiles as well as growth 
some book keeping.

## Properties

```js
{
  // currently available trees.  These objects are cloned in the initProfile method.
  // Generic is a best guess default tree
  // Pont Beaupre is a optimal poplar tree
  trees : {
    Generic : Object,
    'Pont Beaupre' : Object
  },

  // name of current tree being used
  selectedTree : String,

  // number of months we are growing for
  monthsToRun : Number,

  // number of years we are growing for
  years : Number
}
```

## Methods

### clear(callback)

- callback: Function

Resets remove and resets data for this collection.

### cleanup(callback)

- callback: Function

Resets remove and resets data for the Soil and Weather collection.  This is to free up memory.  Once all
parcel growth profiles have been generated the Soil and Weather data are free to be cleared.

### get(id, callback)

- id: String
  - modelProfileId (MD5 of profile) used to access profile
- callback: Function

Get a growth profile

### update(profile, callback)

- id: [Object](../raw-data/growth-profile.html)
- callback: Function

Update growth profile

### initProfile(parcel, callback)

- parcel: [Object](../raw-data/parcel.html)
- callback: Function

Create and initial a new growth profile based on given parcel.  This will fetch weather and soil data
from collections based on afri pixel id.  Set irrigFrac parameter based on parcel **paster** land flag.
Finally generates and sets the modelProfileId on the parcel and saves the profile as well as updates 
the parcel. 