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

var db = mongoskin.db(mongoUri, {safe:true})

app.param('collectionName', function(req, res, next, collectionName){
  req.collection = db.collection(collectionName)
  return next()
})

app.get('/collections/groups', function(req, res) {
  var collection = db.collection('mydb')

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })

})

app.post('/collections/groups', function(req, res) {
  var collection = db.collection('mydb')

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})



var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


