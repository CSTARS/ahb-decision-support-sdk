var logging = false;

var logger = {
  log : function(msg) {
    if( !logging ) return;
    console.log(msg);
  },
  error : function(msg) {
    console.log(msg);
  },
  enable : function(enable) {
    logging = enable;
  }
};

module.exports = logger;
