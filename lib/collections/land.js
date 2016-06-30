
var data = {
  california : {
    irrigated : 340,
    nonirrigated : 40,
    avg : 143
  },
  idaho : {
    irrigated : 181,
    nonirrigated : 29.5,
    avg : 52
  },
  montana : {
    irrigated : 80,
    nonirrigated : 23,
    avg : 29.5
  },
  oregon : {
    irrigated : 195,
    nonirrigated : 80,
    avg : 130
  },
  washington : {
    irrigated : 330,
    nonirrigated : 66,
    avg : 215
  }
}

function LandCollection() {
  
  this.get = function(state, type) {
    return data[state.toLowerCase()][type];
  }

}