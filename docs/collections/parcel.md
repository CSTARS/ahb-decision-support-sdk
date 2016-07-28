---
layout: page
title: Parcels Collection
---

The parcels collection stores all parcels being used for the current run.  The parcels
collection also stores summary information about parcels in the collection.

## Properties

```js
{
  // array of all parcel ids in the collection.  Useful for looping entire collection set
  validId : [String],

  // number of parcels in the collection.  The term valid comes from the fact that not all
  // parcels for the parcel service are used.  Only those who have crops deemed to compete
  // with poplar.
  validCount : Number,

  // Number of parcels that have been selected for use by the biorefinery
  selectedCount : Number,

  // Hash of afri px x-y ids to center points.  When importing parcels, one parcel centeriod 
  // for each afri px is stored.  This point is then used to lookup soil and weather data.
  afriPxs : Object,

  // array of center points for each afri px.  Same as above.  TODO: remove this.
  centerPts : [[Number, Number], ...],

  // min and max poplar adoption prices for parcels below current refinery MWP.
  adoptionPrice : {
    min : Number,
    max : Number
  },

  // min willingness to accept is the minimum poplar price that will convert enough parcels
  // to run the current refinery
  mwa : Number
}
```

## Methods

### reset(callback)

- callback: Function

Resets remove and resets data for this collection.  This method resets the budgets, crops and
growth profiles collecions as well.

### load(lat, lng, radius, callback)

- lat: Number
  - latitude of new refinery
- lng: Number 
  - longitude of new refinery
- radius: Number
  - radius to import poplar from (km)
- callback: Function

Populates this collection with all valid parcels for given lat, lng and radius.

#### Events

The following events will be triggered as a result of this function: 

 - parcels-update-start
 - parcels-update-updated
 - parcels-update-end

### add(parcel, callback)

- parcel: [Object](../raw-data/parcel.html)
- callback: Function

Adds the parcel to the collection, preforms collection book keeping, adds swap and fips info
to the crops collection, adds budget id to budgets collection.

### update(parcel, callback)

- parcel: [Object](../raw-data/parcel.html)
- callback: Function

Update parcel information.

### get(parcelId, callback)

- parcelId: String
- callback: Function

Parcel parcel by id.  Parcel is returned to callback function.

### summarize(callback)

- callback : Function

Get total arces, amount harvests, years, crop type counts and average year harvest for all 
parcels in collection that have been flaged as a 'selected' parcel.

Response object:

```js
{
  // Total Acres
  acres : Number,
  // Total amount of poplar harvest
  harvested : Number,
  // number of years for run
  years : Number,
  // hash of crop swap name to number of parcels current growing crop
  cropCounts : Object,
  // havested / acres
  avgYearHarvest : Number
}
```