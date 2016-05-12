var request;

module.exports = function(r) {
  request = r;

  return {
    toJson : toJson
  };
};

function toJson(json, callback) {
  request
    .post('/export/toJson')
    .send(json)
    .end(function(err, resp){
      debugger;
      callback(err, resp.body);
    });
}