---
layout: page
title: Refinery Collection
---

Stores available refineries as well as the selected refinery 
model [refinery objects](../raw-data/refinery.html).

## Properties

```js
{
  // Currently selected refinery model
  select : Object,

  // All available refineries
  data : [Refinery Object]
}
```

## Methods

### load(callback)

- callback: Function

Load all available refineries.  Currently data is static to app.

### select(name, ror)

- name: String
  - name of refinery to select
- ror: Number
  - Requested rate of return for refinery.

Select a biorefinery to model.  This will create Refinery Model from the 
[Refinery Object](../raw-data/refinery.html).


### getAll()

Return all [refinery objects](../raw-data/refinery.html). 
