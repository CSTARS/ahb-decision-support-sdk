---
layout: page
title: Budgets Collection
---

The budgets collection stores all FarmBudgets.org budget information stored as 
[budget objects](../raw-data/budget.html).

## Properties

```js
{
  // poplar budget currently being used
  poplarBudget : Object,

  // poplar cost per acre
  poplarTotal : Number,

  // array of all budget ids currently stored
  budgetIds : [String]
}
```

## Methods

### clear(callback)

- callback: Function

Resets remove and resets data for this collection.

### get(id)

- id: String
  - state+'-'+crop name

Get a budget

### addBudgetId(id)

- id: String
  - state+'-'+crop name

Add a budget id to list.  This is called by the Parcels Collection when loading parcels.  This list
will be used by the load method, informing the method which budgets to fetch.

### load(callback)

- callback: Function

Load all budgets based on the budgetsId array.

#### Events Triggered

- budgets-update-start
- budgets-update-end

### setPoplarBudget(budget, total)

- budget: [Object](../raw-data/budget.html)
- total: Number

Used by the budget model to set the poplarBudget and poplarTotal id's.