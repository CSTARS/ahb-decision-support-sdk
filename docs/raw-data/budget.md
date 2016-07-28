---
layout: page
title: Budget
---


The budget is actually the result Farm Budgets SDK - Budget Model's getTotal() method.
More on that model can be found here: [https://github.com/CSTARS/farm-budgets-sdk](https://github.com/CSTARS/farm-budgets-sdk)

## Structure

```js
  {
    // the farmbudgets.org UID for this budget
    id : "",

    budget : {
      // date ranges for this budget
      range : {
        // array containing descriptions of every operation preformed for this budget
        all : [
          {
            // start date
            date : Date,
            // length of operation
            length : "1",
            // units for length variable,
            units : "[day|month|year]",
            // name of opertion
            name : ""
          }
        ],
        // budget start date
        start : Date,
        // budget end date
        end : Date
      },
      // array of objects containing each months spending
      spendingByMonth : [
        {
          // this object also contains keys which are the operation name and cost
          // for this month
          month : "MM/YYYY",
          total : Number
        }
      ],
      // total cost over lifetime of this budget
      total : Number
    }

  }

```