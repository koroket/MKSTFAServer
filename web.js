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
app.post('/:id', function(req, res) {
  var collection = db.collection('mydb')

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

app.get('/:id', function(req, res) {
  var collection = db.collection('mydb')

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })

})


app.post('/groups', function(req, res) {
  var collection = db.collection('mydb')

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

app.get('/groups/:id', function(req, res) {
  var collection = db.collection('mydb')

  collection.findById(req.params.id, function(e, result){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

app.put('/col/:collectionName/:id', function(req, res, next) {
  req.collection.updateById(req.params.id, {$set: req.body}, {safe: true, multi: false}, function(e, result){
    if (e) return next(e)
    res.send((result === 1) ? {msg:'success'} : {msg: 'error'})
  })
})

app.delete('/collections/:collectionName/:id', function(req, res, next) {
  req.collection.removeById(req.params.id, function(e, result){
    console.log(result)
    if (e) return next(e)
    res.send((result === 1)?{msg: 'success'} : {msg: 'error'})
  })
})


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


