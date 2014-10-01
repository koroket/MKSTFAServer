var express = require('express'),
  mongoskin = require('mongoskin'),
  bodyParser = require('body-parser')
var logfmt = require("logfmt");
var mongo = require('mongodb');

var app = express()
app.use(bodyParser())

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

// mongo.Db.connect(mongoUri, function (err, db) {
//   db.collection('mydocs', function(er, collection) {
//     collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
//     });
//   });
// });





var db = mongoskin.db(mongoUri, {safe:true})

app.param('collectionName', function(req, res, next, collectionName){
  req.collection = db.collection(collectionName)
  return next()
})

app.get('/collections/candys', function(req, res) {
  var collection = db.collection('mydocs')

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })

})

app.post('/collections/candys', function(req, res) {
  var collection = db.collection('mydocs')

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})



var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


