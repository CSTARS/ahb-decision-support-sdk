---
layout: page
title: Parcel
---

The parcel is the centerpiece object used in the SDK.  It's always a GeoJSON Feature type.
For ease of reading, here is the GeoJSON Feature structure.  Below, is the properties
for the parcel.

The root of this object comes from the Univerity of Washington's ArcGIS Service located
here [https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer](https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer)
It is then run through the [terraformer-arcgis-parser](https://www.npmjs.com/package/terraformer-arcgis-parser)
module producing GeoJSON.  The properties for this structure are then paired down, storing
only what's required to preserve memory.  Additional information added to the parcel via the SDK
is stored under the **properties.ucd** namespace. 

## GeoJSON Feature

```js
{
  type : "Feature",
  geometry : {
    // see http://geojson.org/geojson-spec.html#geometry-objects
    // most parcels are of type Polygon or MultiPolygon
  },
  properties : {
    // see below.
  }
}
```

## Properties Structure

```js
{
  GISAcres : Number,
  PotentiallySuitPctOfParcel : Number,
  SiteAddressFull : String,
  Township : String,
  // UID for parcel, mapped from PolyID so a more standard 'id' variable could be used
  id : String,
  // PotentiallySuitPctOfParcel * GISAcres, added by sdk
  usableSize : Number,

  // additional information added by the SDK
  ucd : {
    // is the poplar price for this parcel (including transportation) above the 
    // refineries max willeness to pay (MWP)
    aboveRefineryWillingToPay : Boolean,

    // price required to adopt poplar.  This price is must allow the farm to make
    // more $ than the incumbent crop and must allow the farm actually make money.
    // so no negative revenue poplar adoption.
    adoptionPrice : Number,

    // based on competing parcels in current radius that have refineryGatePrice 
    // below MWP, where does this parcel stand. (refineryGatePrice - Min) / (Max - Min)
    adoptionPricePercentile : Number,

    // afri x-y pixel identifier.  Used to lookup weather and soil data.
    afriPx : String,

    // array of budget ids (FarmBudgets.org UID's) for crops in cropInfo.swap.  The
    // ids in this array are in the same order as cropInfo.swap
    budgetIds : [String],

    // parcel centroid.  [Lng, Lat]
    center : [Number, Number],

    // information about incumbent crops.  This is returned from the crop type service
    cropInfo : {
      // fips code, location information for crop
      fips : String,
      // is this pasture land?  This flag is set based on certain swap types which are
      // assumed to be pasture (non-irrigated) land types.  Set in controllers.parcels.init
      pasture : Boolean,
      // which state are we in, fullname
      state : String,
      // array of incumbent crop names.  These names may modified from the returned crop
      // type service in controllers.parcels.init
      swap : [String]
    },

    // objects containing information on the actual cost to farm for both incumbent crops
    // as well as poplar
    farmCosts : {

      // contains information for the incumbent crops
      crops : {
        // total cost for incumbent crop at farm gate over length of run (per Acre).
        totalFarmGateCost : Number,
        // breakdown of cost by year
        yearlyData : [
          {
            // cost of crop, from FarmBudgets.org budget. (see budget object)
            crop : Number,
            // additional land rent cost.  Form most of the budgets, land rent has been
            // included.  So no additional value is set here.
            land : Number,
            // additional irrigation cost.  Form most of the budgets, irrigation cost has been
            // included.  So no additional value is set here.
            water : Number
          }
        ]
      },

      poplar : {
        // how much, on average, it costs to transport poplar to the refinery.  Mg/Acre.
        avgTransportationCostPerYear : Number,
        // total cost to grow poplar per Acre over lifetime at the farm gate.
        totalFarmGateCost : Number,
        // total transportation cost per Acre over lifetime.
        totalTransportationCost : Number,
        // breakdown cost by year
        yearlyData : [
          {
            // cost per acre per year to grow poplar,
            crop : Number,
            // land rent for parcel, per acre.
            land : Number,
            // transportation per acre for this year.  Will only have non-zero value on harvest years.
            transportation : Number,
            // irrigation cost.  If the incumbent crop is non-irrigated, then the poplar will be 
            // grown w/o irrigation as well and this value will be 0.  per acre per year.
            water : Number
          }
        ]
      },

    }, // end farmCosts

    // like formCosts, but looking at incumbent crop vs poplar income for the parcel.
    income : {
      // incumbent crop income
      crops : {
        // total income for incumbent crop over lifetime.  per acre.
        total : Number,
        // yearly breakdown of income by year.  per acre.
        yearlyData : [Number]
      },

      // poplar income
      poplar : {
        // total income for poplar over lifetime. per acre.
        total : Number,
        // yearly breakdown of income by year.  per acre.  This will be 0 on non-harvest years.
        yearlyData : [Number]
      },
    }, // end income

    // MD5 UID for the growth profile for this parcel.  For more information see the Growth Profile Object.
    modelProfileId : String,

    // Poplar cost at the refinery gate.  Per acre. Per harvest
    refineryGateCost : Number,

    // Either 1 or 0.  Is this parcel currently 'selected', ie being used by the refinery.  
    // Why Number and not Boolean.  Cause I tried to switch to IndexedDB and I couldn't build
    // a index on a Boolean value.....
    selected : Number,

    // fullname of state parcel resides in.
    state : String
  }
}
```