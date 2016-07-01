// acre-ft
var data = {
  california : 115,
  washington : 35, 
  idaho : 35, 
  oregon : 35,
  montana : 30
};

function WaterCollection() {

  this.getCost = function(state) {
    return data[state.toLowerCase()];
  };

}

return new WaterCollection();