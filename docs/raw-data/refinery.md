---
layout: page
title: Refinery
---

The refinery data is currently static inside the app.  When a refinery is selected, the object is 
inherited into the Refinery Model and set as the Refinery Collection **selected** attribute.

## Structure

```js
{
  // Rate of return.  %
  ROR : Number,

  // Cost of refinery
  capitalCost : Number,

  // max amount of feedstock refinery can handle.  This should be used
  // to assume the refinery is running optimal
  feedstockCapacity : {
    value : Number,
    units : units
  },

  // calculated from several parameters.  See the Refinery Model setMWP() function.
  maxWillingToPay : Number,

  // Refinery name, normally includes description of product
  name : String,

  // how much to run the refinery per year
  operatingCost : {
    units : String,
    value : Number
  },

  // current price being paid for poplar
  poplarPrice : Number,

  // product yield.  ie conversion from poplar to product
  yield : {
    units : String,
    value : Number
  }

}
```