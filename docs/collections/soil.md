---
layout: page
title: Soil Collection
---

Stores all soil data for the 3pg growth profiles based on afri px id.
[soil object](../raw-data/soil.html).

## Methods

### clear(callback)

- callback: Function

Clear data in this collection

### load(callback)

- callback: Function

Load all soil data for every afri px in the [parcels collection](parcel.html).

#### Events

 - soil-update-start
 - soil-update-end

### get(afriPx, callback)

- afriPx: String
  - afri px id [row]-[col]
- callback: Function

Get [Soil Object](../raw-data/soil.html) by afri px.
