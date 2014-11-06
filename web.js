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
var request = require('request');
var cheerio = require('cheerio');

var async = require('async')

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

// ===================================================================
//                          Post Methods
// ===================================================================

/*
 * Not being used? Look into....
 */
app.post('/ppl/:friend', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.insert(req.body, {}, function(e, results){
    if (e) res.status(500).send()
    res.send(results) 
  })
})

/*
 * Network Communication - linkDeviceToken
 * Gets called after we receive device token. Connects token with friend database
 */
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

/*
 * FriendViewController - createGroup
 * 1 - gets information from yelp
 * 2 - gets device tokens
 * 3 - creates a new group object
 * 4 - inserts group code into all of the friend's arrays
 * 5 - sends push notification to friends
 */
app.post('/yelp/:lat/:longi/:search/:mynum/:myId', function(req, res) {

  // async.parallel([
  //   function(callback) {
  //       db.get('users', userId, function(err, user) {
  //           if (err) return callback(err);
  //           callback();
  //       });
  //   },
  //   function(callback) {
  //       db.query('posts', {userId: userId}, function(err, posts) {
  //           if (err) return callback(err);
  //           callback();
  //       });
  //   }
  // ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
  //   if (err) return next(err); //If an error occured, we let express/connect handle it by calling the "next" function
  // });


  // var newTokenArray = []
  // async.parallel([
  //   function(callback){
  //     yelp.search({limit: req.params.mynum,ll:fixed, term:req.params.search}, function(yelpError, yelpData){
  //       if(yelpError)
  //       {
  //         console.log("yelp failed")
  //          res.status(500).send()//YelpFailedLetThemKnow
  //       }
  //       var info = yelpData["businesses"]
  //           var decisionObjects = []
  //           var tempReplies = []
  //           for(var i = 0; i<info.length; i++)
  //           {
  //             var infoDictionary = info[i]
  //             tempReplies.push(0)
  //             var temp = {}
  //             temp["Name"] = infoDictionary["name"]
  //             if(("image_url" in info[i]))
  //             {
  //               temp["ImageURL"] = infoDictionary["image_url"]
  //             }
  //             if(("categories" in info[i]))
  //             {
  //               var categoryArray = infoDictionary["categories"]
  //               var fixedCategoryArray = []
  //               for(var m = 0; m < categoryArray.length; m++)
  //               {
  //                 var specificarray = categoryArray[m]
  //                 fixedCategoryArray.push(specificarray[0]);
  //               }
  //               temp["Category"] = fixedCategoryArray
  //             }
  //             if(("distance" in info[i]))
  //             {
  //               temp["distance"] = infoDictionary["distance"]
  //             }
  //             if(("rating" in info[i]))
  //             {
  //               temp["rating"] = infoDictionary["rating"]
  //             }
  //             decisionObjects.push(temp)
  //           }
  //           var sendDictionary = {}
  //           sendDictionary["Done"] = -1;
  //           sendDictionary["Number"] = info.length
  //           sendDictionary["Replies"] = tempReplies
  //           sendDictionary["Objects"] = decisionObjects
  //           sendDictionary["Tokens"] =  newTokenArray//want to add later

  //           var groupCollection = db.collection('groups')

  //           groupCollection.insert(sendDictionary, {}, function(groupError, groupResults){
  //             if (groupError)
  //               {
  //                  console.log("group creation failed")
  //                  res.status(500).send()
  //               }
  //             callback(null)
  //           }
  //     }
  //   },
  //   function(callback){
  //     var counter = 0
  //     var tokenArray = req.body.friends
  //     for(var j = 0;j<tokenArray.length;j++)
  //     {
  //       var dbString = tokenArray[j] + "token"
  //       var tokenCollection = db.collection(dbString)
  //       tokenCollection.find({} ,{}).toArray(function(tokenError, tokenResults){
  //         if (tokenError)
  //           {
  //             console.log("token failed")
  //             res.status(500).send()
  //           }
  //         newTokenArray.push(tokenResults[0].token)
  //         counter++
  //         if(counter==tokenArray.length)
  //         {
  //           callback(null)
  //         }
  //       }
  //     }
  //   }
  // ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
  //   if (err) return next(err); 
  //   for(var i = 0; i < tokenArray.length; i++)
  //             {
  //               var personalDictionary = {}
  //               personalDictionary["groupID"] = groupResults[0]._id;
  //               personalDictionary["number"] = tokenArray.length
  //               personalDictionary["currentIndex"] = 0
  //               personalDictionary["owner"] = req.body.myName
  //               personalDictionary["ownerID"] = req.params.myId
  //               personalDictionary["friendID"] = req.body.friends
  //               var dbString2 = tokenArray[i] + "groups"
  //               var friendCollection = db.collection(dbString2)
  //               var counter2 = 0;
  //               friendCollection.insert(personalDictionary, {}, function(friendError, friendResults){
  //                 if (friendError)
  //                   {
  //                     console.log("creation friend side failed")
  //                     res.status(500).send()
  //                   } 
  //                   console.log("creation friend side good")
  //                   var myDevice = new apn.Device(newTokenArray[counter2]);
  //                   counter2++
  //                   var note = new apn.Notification();

  //                   note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
  //                   note.badge = 0;
  //                   note.sound = "ping.aiff";
  //                   note.alert = "\uD83D\uDCE7 \u2709 You have a new group invite";
  //                   note.payload = {'messageFrom': req.body.myName, 'type': "message"};

  //                   apnConnection.pushNotification(note, myDevice);
  //                   if(counter2==newTokenArray.length)
  //                   {
  //                     console.log("everything good")
  //                     res.send("FASHOOOO")
  //                   }
  //               })
  //             }
  // });


  var fixed = req.params.lat + ',' + req.params.longi
  yelp.search({sort: 1, limit: req.params.mynum,ll:fixed, term:req.params.search}, function(yelpError, yelpData) {
  
      if(yelpError)
      {
        console.log("yelp failed")
         res.status(500).send()//YelpFailedLetThemKnow
      }

      var tokenArray = req.body.friends//
  
      var newTokenArray = []//

      var counter = 0//
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
            console.log(info)
            var decisionObjects = []
            var tempReplies = []
            for(var i = 0; i<info.length; i++)
            {
              var infoDictionary = info[i]
              console.log(infoDictionary["categories"])
              tempReplies.push(0)
              var temp = {}
              temp["Name"] = infoDictionary["name"]
              if(("image_url" in info[i]))
              {
                temp["ImageURL"] = infoDictionary["image_url"]
              }
              if(("categories" in info[i]))
              {
                var categoryArray = infoDictionary["categories"]
                var fixedCategoryArray = []
                for(var m = 0; m < categoryArray.length; m++)
                {
                  var specificarray = categoryArray[m]
                  fixedCategoryArray.push(specificarray[0]);
                }
                temp["Category"] = fixedCategoryArray
              }
              if(("distance" in info[i]))
              {
                temp["distance"] = infoDictionary["distance"]
              }
              if(("rating" in info[i]))
              {
                temp["rating"] = infoDictionary["rating"]
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
                personalDictionary["number"] = tokenArray.length
                personalDictionary["currentIndex"] = 0
                personalDictionary["owner"] = req.body.myName
                personalDictionary["ownerID"] = req.params.myId
                personalDictionary["friendID"] = req.body.friends
                var dbString2 = tokenArray[i] + "groups"
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

// ===================================================================
//                          Get Methods
// ===================================================================

app.get('/yelp/:lat/:longi/:search/:offset', function(req, res) {
  console.log("started")
  var fixed = req.params.lat + ',' + req.params.longi
  yelp.search({sort:0, offset: req.params.offset,limit: 20,ll:fixed, term:req.params.search}, function(error, data) {
  if(error) res.status(500).send()//YelpFailedLetThemKnow
  var info = data["businesses"]
  var decisionObjects = []
  for(var i = 0; i<info.length; i++)
  {
    var infoDictionary = info[i]
    var temp = {}
    temp["Name"] = infoDictionary["name"]
    if(("image_url" in info[i]))
    {
      temp["ImageURL"] = infoDictionary["image_url"]
    }
    if(("categories" in info[i]))
    {
      var categoryArray = infoDictionary["categories"]
      var fixedCategoryArray = []
      for(var m = 0; m < categoryArray.length; m++)
      {
        var specificarray = categoryArray[m]
        fixedCategoryArray.push(specificarray[0]);
      }
      temp["Category"] = fixedCategoryArray
    }
    if(("distance" in info[i]))
    {
      temp["distance"] = infoDictionary["distance"]
    }
    if(("rating" in info[i]))
    {
      temp["rating"] = infoDictionary["rating"]
    }
    decisionObjects.push(temp)

    url = infoDictionary["url"];

  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      var title, release, rating;
      var json = { title : "", release : "", rating : ""};

            // We'll use the unique header class as a starting point.

      $('span.hour-range').filter(function(){

           // Let's store the data we filter into a variable so we can easily see what's going on.

            var data = $(this);

           // In examining the DOM we notice that the title rests within the first child element of the header tag. 
           // Utilizing jQuery we can easily navigate and get the text by writing the following code:

            console.log(data.children().third().text())

           // Once we have our title, we'll store it to the our json object.

           // json.title = title;
          })
      $('dd.nowrap price-description').filter(function(){

           // Let's store the data we filter into a variable so we can easily see what's going on.

            var data = $(this);

           // In examining the DOM we notice that the title rests within the first child element of the header tag. 
           // Utilizing jQuery we can easily navigate and get the text by writing the following code:

            console.log(data.text())

           // Once we have our title, we'll store it to the our json object.

           // json.title = title;
          })
    }
  })
  }

  res.send(decisionObjects)
  
  
  });
  

})

/*
 * GroupTableViewController - resetPeople
 * When reset everything is pressed, this method is called and deletes the 
   group data of the persons that are passed into it as parameters
 */
app.get('/ppl/:friend', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })
})

/*
 * GroupTableViewController - getGoogle
 * ****CURRENTLY UNUSED*****
 */
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

/*
 * Currently Unused - (For Debugging)
 * Fetches all of the group data from every user
 */
app.get('/groups', function(req, res) {
  var collection = db.collection('groups')
  collection.find({} ,{}).toArray(function(e, results){
    if (e) res.status(500).send()
    res.send(results)
  })
})

/*
 * GroupTableViewController - tableView:didSelectRowAtIndexPath
 * Gets information for a single group (the one that the user selected)
 */
app.get('/groups/:id', function(req, res) {
  var collection = db.collection('groups')

  collection.findById(req.params.id, function(e, result){
    if (e) res.status(500).send()
    res.send(result)
  })
})

// ===================================================================
//                          Delete Methods
// ===================================================================

/*
 * GroupTableViewController - deleteGroup
 * Deletes a group from the group database
 */
app.delete('/groups/:id', function(req, res, next) {
  var collection = db.collection('groups')
  collection.removeById(req.params.id, function(e, result){
    console.log(result)
    if (e) return next(e)
    res.send((result === 1)?{msg: 'success'} : {msg: 'error'})
  })
})

/*
 * GroupTableViewController - deleteGroup
 * Deletes a group from the array of groups that an individual person has 
 */
app.delete('/ppl/:friend/:id', function(req, res) {
  var collection = db.collection(req.params.friend)

  collection.removeById(req.params.id, function(e, result){
    console.log(result)
    if (e) return next(e)
    res.send((result === 1)?{msg: 'success'} : {msg: 'error'})
  })

})

// ===================================================================
//                          Put Methods
// ===================================================================
/*
 * DraggableBackground - yesWith:index:andUrl
 * Increment the number of yesses for one card and if number of yesses equals number of 
 people in the group also send push notification with info of the match
*/
app.put('/groups/:id/:number/:selfID/:friend/:numppl', function(req, res, next) {
  var collection = db.collection('groups')
  var collection2 = db.collection(req.params.friend);
  var str1 = "Replies.";
  var str2 = req.params.number;
  var variable = str1.concat(str2);
  var action = {};

  action[variable] = 1;
  collection.updateById(req.params.id, {$inc:action}, {safe: true, multi: false}, function(e, result){
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

/*
 * *****CURRENTLY UNUSED******
 */
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
      res.send({
        NumberOfReplies:result2.Replies[req.params.number] }
      )
    })
  })
})

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


