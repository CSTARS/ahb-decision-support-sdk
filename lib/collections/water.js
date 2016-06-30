// acre-ft
var data = {
  california : 115,
  washington : 35, 
  idaho : 35, 
  oregon : 35,
  montana : 30
};

function WaterCollection() {

  this.get = function(data) {
    return data[state.toLowerCase()];
  };

}

return new WaterCollection();