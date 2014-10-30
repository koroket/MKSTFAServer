var express = require('express'),
  mongoskin = require('mongoskin'),
  bodyParser = require('body-parser')
var logfmt = require("logfmt");
var mongo = require('mongodb');
var apn = require('apn');
var yelp = require("yelp").createClient({
  consumer_key: "XPHL16m1XKlQsm4JJM8ZLw", 
  consumer_secret: "dRSDF7CtQIbRV-WAEGd_Yg8jUzo",
  token: "PMSIKP0XrmmaqoCzHjwRB9K3DM4oIDOf",
  token_secret: "KRSvWPtiHBp-NLmfz8xeArwKDZ0"
});

var GooglePlaces = require("googleplaces");
var googlePlaces = new GooglePlaces("AIzaSyC5p7KH-SOmf2dgYFMqFm9H1vYAXX0jcMs", "json");


var options = { };

var apnConnection = new apn.Connection(options);

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
app.post('/token/:friend', function(req, res) {
  var collection = db.collection(req.params.friend)
  collection.count({}, function(error, numOfDocs) {
    if(numOfDocs<1)
    {
        collection.insert(req.body, {}, function(e, results){

        if (e) res.status(500).send()
        res.send(results) 

        })  
    }
    else
    {
        collection.find().toArray(function(err, docs) {
        res.send(docs);
        });
    }
  })

})

app.get('/token/:friend', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })

})

app.get('/yelp/:lat/:longi/:search/:mynum', function(req, res) {
  console.log('myside is startinng to send');
  var myvar = {latitude:37.46,longitude:122.25}
  var fixed = req.params.lat + ',' + req.params.longi
  console.log(fixed)
  yelp.search({limit: req.params.mynum,ll:fixed, term:req.params.search}, function(error, data) {
  if(error) res.status(500).send()//YelpFailedLetThemKnow
  var info = data["businesses"]

  var decisionObjects = []
  var tempReplies = []
  for(var i = 0; i<info.length; i++)
  {
    var infoDictionary = info[i]
    tempReplies.push(0)
    var temp = {}
    temp["Name"] = infoDictionary["name"]
    if(("image_url" in info[i]))
    {
      temp["ImageURL"] = infoDictionary["image_url"]
    }
    decisionObjects.push(temp)
  }
  var sendDictionary = {}
  sendDictionary["Done"] = -1;
  sendDictionary["Number"] = info.length
  sendDictionary["Replies"] = tempReplies
  sendDictionary["Objects"] = decisionObjects
  console.log("popo")
  console.log(sendDictionary)
  //sendDictionary["Tokens"] = 
    res.send(data)
  
  
});
  

})


app.post('/yelp/:lat/:longi/:search/:mynum/:myId', function(req, res) {

  console.log('called');

  var fixed = req.params.lat + ',' + req.params.longi
  yelp.search({limit: req.params.mynum,ll:fixed, term:req.params.search}, function(yelpError, yelpData) {
  
      if(yelpError)
      {
        console.log("yelp failed")
         res.status(500).send()//YelpFailedLetThemKnow
      }
      console.log("yelp good")
      var tokenArray = req.body.friends
  
      var newTokenArray = []

      var counter = 0
      for(var j = 0;j<tokenArray.length;j++)
      {
      var dbString = tokenArray[j] + "token"
      var tokenCollection = db.collection(dbString)

      tokenCollection.find({} ,{}).toArray(function(tokenError, tokenResults){
            if (tokenError)
              {
                console.log("token failed")
                res.status(500).send()
              } 
              console.log("token good")
            newTokenArray.push(tokenResults[0].token)
            counter++

            //completion handler
          if(counter==tokenArray.length)
          {
            var info = yelpData["businesses"]

            var decisionObjects = []
            var tempReplies = []
            for(var i = 0; i<info.length; i++)
            {
              var infoDictionary = info[i]
              tempReplies.push(0)
              var temp = {}
              temp["Name"] = infoDictionary["name"]
              if(("image_url" in info[i]))
              {
                temp["ImageURL"] = infoDictionary["image_url"]
              }
              decisionObjects.push(temp)
            }
            var sendDictionary = {}
            sendDictionary["Done"] = -1;
            sendDictionary["Number"] = info.length
            sendDictionary["Replies"] = tempReplies
            sendDictionary["Objects"] = decisionObjects
            sendDictionary["Tokens"] =  newTokenArray

            var groupCollection = db.collection('groups')

            groupCollection.insert(sendDictionary, {}, function(groupError, groupResults){
              if (groupError)
                {
                   console.log("group creation failed")
                   res.status(500).send()
                }
              console.log("group creation good")
              for(var i = 0; i < tokenArray.length; i++)
              {
                var personalDictionary = {}
                personalDictionary["groupID"] = groupResults[0]._id;
                personalDictionary["number"] = tokenArray.count
                personalDictionary["currentIndex"] = 0
                personalDictionary["owner"] = req.body.myName
                personalDictionary["ownerID"] = req.params.myId
                var dbString2 = tokenArray[i] + "token"
                var friendCollection = db.collection(dbString2)
                var counter2 = 0;
                friendCollection.insert(personalDictionary, {}, function(friendError, friendResults){
                  if (friendError)
                    {
                      console.log("creation friend side failed")
                      res.status(500).send()
                    } 
                    console.log("creation friend side good")
                    var myDevice = new apn.Device(newTokenArray[counter2]);
                    counter2++
                    var note = new apn.Notification();

                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 0;
                    note.sound = "ping.aiff";
                    note.alert = "\uD83D\uDCE7 \u2709 You have a new group invite";
                    note.payload = {'messageFrom': req.body.myName, 'type': "message"};

                    apnConnection.pushNotification(note, myDevice);
                    if(counter2==newTokenArray.length)
                    {
                      console.log("everything good")
                      res.send("FASHOOOO")
                    }
                })
              }
            })
          }
        })
      }
   });
})

app.get('/google/:search', function(req, res) {
  
/**
 * Place search - https://developers.google.com/places/documentation/#PlaceSearchRequests
 */
    var parameters;

    parameters = {
        location:[40.67, -73.94],
        types: req.params.search
    };

    googlePlaces.placeSearch(parameters, function (response) {
  googlePlaces.placeDetailsRequest({reference:response.results[0].reference}, function (response) {
    res.send(response.result)
  });
});
  

})


app.post('/groups', function(req, res) {
  var collection = db.collection('groups')

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

app.get('/token/push/:token/:daname', function(req, res) {
  var myDevice = new apn.Device(req.params.token);

    var note = new apn.Notification();

note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
note.badge = 0;
note.sound = "ping.aiff";
note.alert = "\uD83D\uDCE7 \u2709 You have a new group invite";
note.payload = {'messageFrom': req.params.daname, 'type': "message"};

apnConnection.pushNotification(note, myDevice);
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
    res.send(result)
  })
})

app.put('/groups/:id/:number/:selfID/:friend/:numppl', function(req, res, next) {

  var collection = db.collection('groups')
  var collection2 = db.collection(req.params.friend);

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
      collection2.updateById(req.params.selfID,{$inc:{"currentIndex": 1}},{safe: true, multi: false}, function(e3, result3){
         if(e3) res.status(500).send()
          if(result2.Replies[req.params.number]==req.params.numppl){
            console.log(result2.Replies[req.params.number])
            console.log(req.params.numppl)
            console.log("yes")
            for (var i = 0; i < result2.Tokens.length; i++) {
                  console.log(i)
                  var myDevice = new apn.Device(result2.Tokens[i]);

                  var note = new apn.Notification();

                  note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                  note.badge = 3;
                  note.sound = "ping.aiff";
                  note.alert = "\uD83D\uDCE7 \u2709 You have a new group invite";
                  note.payload = result2.Objects[req.params.number];

                  apnConnection.pushNotification(note, myDevice);
            }
          }
          else{
            console.log(result2.Replies[req.params.number])
            console.log(req.params.numppl)
          }
         res.send({NumberOfReplies:result2.Replies[req.params.number]})
      })
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


