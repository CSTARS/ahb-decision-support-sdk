---
layout: page
title: Crops Price/Yield
---

## Structure

Crop Price and Yield data is stored and accessed via the Crops Collection.  The collection stores
the data in a hash using **swap name** and **fips** code as keys

```js
{
  "[swap name]" : {
    "[fips code]" : {
      // crop price/yield data
    }
  }
}
```

The crop price/yield object then has the following structure:

```js
{
  price : {
    price : Number,
    unit : String
  },
  // Note, not all crop/fips code combinations have irrigated & non-irrigated values.  The
  // Crops collection handles retrival of these values and return the unspecified value
  // if one or the other is asked for but does not exist.
  yield : {
    irrigated : Number,
    non-irrigated : Number,
    unit : String,
    unspecified: Number
  }
}
```
