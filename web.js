var express = require('express'),
  mongoskin = require('mongoskin'),
  bodyParser = require('body-parser')
var logfmt = require("logfmt");
var mongo = require('mongodb');

var yelp = require("yelp").createClient({
  consumer_key: "XPHL16m1XKlQsm4JJM8ZLw", 
  consumer_secret: "dRSDF7CtQIbRV-WAEGd_Yg8jUzo",
  token: "PMSIKP0XrmmaqoCzHjwRB9K3DM4oIDOf",
  token_secret: "KRSvWPtiHBp-NLmfz8xeArwKDZ0"
});

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

app.post('/ppl/:friend', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

app.get('/ppl/:friend', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })

})

app.get('/yelp/:location/:search/:mynum', function(req, res) {
  
  yelp.search({limit: req.params.mynum, location: req.params.location, term:req.params.search}, function(error, data) {
  if(error) res.status(500).send()
    res.send(data)
});
  

})



app.post('/groups', function(req, res) {
  var collection = db.collection('groups')

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

app.get('/groups', function(req, res) {
  var collection = db.collection('groups')

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })
})

app.get('/groups/:id', function(req, res) {
  var collection = db.collection('groups')

  collection.findById(req.params.id, function(e, result){
    if (e) res.status(500).send()
    res.send(result.Objects)
  })
})

app.put('/groups/:id/:number', function(req, res, next) {

  var collection = db.collection('groups')

  var str1 = "Replies.";
  var str2 = req.params.number;
  var variable = str1.concat(str2);
  
 var action = {};

 action[variable] = 1;
  collection.updateById(req.params.id, {$inc:
    action
  }, {safe: true, multi: false}, function(e, result){
    if (e) res.status(500).send()
    collection.findById(req.params.id, function(e2, result2){
      if (e2) res.status(500).send()
        console.log(result2.Replies[req.params.number]);
      res.send({NumberOfReplies:result2.Replies[req.params.number] }

        )
    })
  })
})
app.put('/groups/:id/:number/finished', function(req, res, next) {

  var collection = db.collection('groups')

  var str1 = "Done";

  
 var action = {};

 action[variable] = req.params.number;
  collection.updateById(req.params.id, {$set:
    action
  }, {safe: true, multi: false}, function(e, result){
    if (e) res.status(500).send()
    collection.findById(req.params.id, function(e2, result2){
      if (e2) res.status(500).send()
        console.log(result2.Replies[req.params.number]);
      res.send({NumberOfReplies:result2.Replies[req.params.number] }

        )
    })
  })
})
app.delete('/groups/:id', function(req, res, next) {
  var collection = db.collection('groups')
  collection.removeById(req.params.id, function(e, result){
    console.log(result)
    if (e) return next(e)
    res.send((result === 1)?{msg: 'success'} : {msg: 'error'})
  })
})
app.delete('/ppl/:friend/:id', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.removeById(req.params.id, function(e, result){
    console.log(result)
    if (e) return next(e)
    res.send((result === 1)?{msg: 'success'} : {msg: 'error'})
  })

})

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


