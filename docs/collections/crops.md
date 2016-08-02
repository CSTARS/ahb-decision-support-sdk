---
layout: page
title: Crops Collection
---

The crops collection stores all incumbent crop price and yield data by fips code.  
The stored crop object descriptions can begoudn here [crop objects](../raw-data/crops.html).

## Properties

```js
{
  // Hash of all used swap names
  swapTypes : Object,

  // Hash of all used fips codes
  fips : Number,

  priceYield : {
    // crop yeild data stored as this.priceYield.data[swapName][fips]
    data : {}
  }

  // array of all budget ids currently stored
  budgetIds : [String]
}
```

## Methods

### clear()

Resets remove and resets data for this collection.

### addSwapType(type)

- type: String
  - add swap name to swapTypes hash

This is called when parcels are requested.  The swapTypes hash is then used to lookup 
data for all swap types.


### addFips(code)

- code: String
  - FIPS code

This is called when parcels are requested.  The fips hash is then used to lookup 
data for all swap types.

### load(callback)

- callback: Function

Load all price and yield data for swap names in swapTypes hash at fips hash locations. 

#### Events Triggered

- crop-priceyield-update-start
- crop-priceyield-update-end

### getCropPriceAndYield(crop, fips)

- crop: String
  - swap name
- fips: String

Return price and yield data crop crop at fips code.   This function as serveral fallbacks.
If the fips longer county fips is not found, a state level code will be used.  If that fails 
as well, a first available for crop type will be used.  If the crop type does not exist, then
error will be thrown.