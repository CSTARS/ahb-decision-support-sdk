---
layout: page
title: Transportation
---

Parcel to refinery transportation information.  [OSRM](http://project-osrm.org/) is used for routing.
And the Transportation Object is very similar to the response from the routing engine.

## Structure

```js
{
  // travel distance
  distance : Number,
  // travel distance units (default is km)
  distanceUnit : Number,
  // time to travel to refinery
  duration : Number,
  // time to travel units (default is h)
  durationUnit : Number,
  // parcel id
  id : String,
  // array of path segment id's.  To save space, paths are broken up
  // into segments and given ids.  This way the geometry of each
  // segment is only sent and stored once, only the path segment id
  // is stored with each Transportation Object.  This is only sent 
  // if route geometry is requested.
  path : [Number],
  // string summary of route
  summary : String
}
```

## Path Segment Structure

This is only sent if route geometry is requested.  Is of type GeoJSON Feature.

```js
{
  type : 'Feature',
  geometry : {
    // Line String: http://geojson.org/geojson-spec.html#linestring
  },
  properties : {
    // path segement id
    id : Number
  }
}
```