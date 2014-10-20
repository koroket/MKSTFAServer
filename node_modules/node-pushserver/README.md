# Push Server

Push Server is a cross-plateform push server based on [node-apn](https://github.com/argon/node-apn) and [node-gcm](https://github.com/ToothlessGear/node-gcm). Push Server currently supports iOS (APN) and android (GCM) platforms. It uses mongoDB to store the push tokens. 
Note that this server is not meant to be used as a front facing server as there's no particular security implemented.


## Getting started

### 1 - Database

node-pushserver uses mongodb to store the user / token associations. So you need to have a Mongo database setup beforehand

See MongoDB ([MongoDB Download page](http://www.mongodb.org/downloads)).


### 2 - Install node-pushserver
+ From npm directly:

```shell
$ npm install node-pushserver -g
```

+ From git:

```shell
$ git clone git://github.com/Smile-SA/node-pushserver.git
$ cd node-pushserver
$ npm install -g
```

### 3 - Configuration

If you checked out this project from github, you can find a configuration file example named 'example.config.json'.


```js
{
	"webPort": 8000,

    "mongodbUrl": "mongodb://username:password@localhost/database",

    "gcm": {
        "apiKey": "YOUR_API_KEY_HERE"
    },

    "apn": {
        "connection": {
            "gateway": "gateway.sandbox.push.apple.com",
            "cert": "/path/to/cert.pem",
            "key": "/path/to/key.pem"
        },
        "feedback": {
            "address": "feedback.sandbox.push.apple.com",
            "cert": "/path/to/cert.pem",
            "key": "/path/to/key.pem",
            "interval": 43200,
            "batchFeedback": true
        }
    }
}

```

+ Checkout [GCM documentation](http://developer.android.com/guide/google/gcm/gs.html) to get your API key.

+  Read [Apple's Notification guide](https://developer.apple.com/library/ios/#documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Introduction.html) to know how to get your certificates for APN.

+ Please refer to node-apn's [documentation](https://github.com/argon/node-apn) to see all the available parameters and find how to convert your certificates into the expected format. 


### 4 - Start server

```shell
$ pushserver -c /path/to/config.json
```

### 5 - Enjoy!



## Usage
### Web Interface
You can easily send push messages using the web interface available at `http://domain:port/`.

### Web API

#### Send a push
```
http://domain:port/send (POST)
```
+ The content-type must be 'application/json'.
+ Format : 

```json
{
  "users": ["user1"],
  "android": {
    "collapseKey": "optional",
    "data": {
      "message": "Your message here"
    }
  },
  "ios": {
    "badge": 0,
    "alert": "Your message here",
    "sound": "soundName"
  }
}
```

+ "users" is optionnal, but must be an array if set. If not defined, the push message will be sent to every user (filtered by target).
+ You can send push messages to Android or iOS devices, or both, by using the "android" and "ios" fields with appropriate options. See GCM and APN documentation to find the available options. 

#### Send push notifications
```
http://domain:port/sendBatch (POST)
```
+ The content-type must be 'application/json'.
+ Format : 

```json
{
  "notifications": [{
      "users": ["user1", "user2"],
      "android": {
        "collapseKey": "optional",
        "data": {
          "message": "Your message here"
        }
      },
      "ios": {
        "badge": 0,
        "alert": "Foo bar",
        "sound": "soundName"
      }
    },{
      "users": ["user4"],
      "android": {
        "collapseKey": "optional",
        "data": {
          "message": "Your other message here"
        }
      }
    }
  ]
}
```


#### Subscribe
```
http://domain:port/subscribe (POST)
```
+ The content-type must be 'application/json'.
+ Format:
```js
{
  "user":"user1",
  "type":"android",
  "token":"CAFEBABE"
}
```
+ All field are required
+ "type" can be either "android" or "ios"
+ A user can be linked to several devices and a device can be linked to serveral users.

#### Unsubscribe
```
http://domain:port/unsubscribe (POST)
```
+ The content-type must be 'application/json'.
+ Format:
```js
{
  "token":"CAFEBABE"
}
```
or
```js
{
  "user":"user1"
}
```

+ You can unsubscribe either a particular device, or all the devices for one user

#### List Users
```
http://domain:port/users (GET)
```
+ Response format: 
```js
{
    "users": [
        "vilem"
    ]
}
```

#### List user's associations
```
http://domain:port/users/{user}/associations (GET)
```
+ Response format

```js
{
    "associations": [
        {
            "user": "vilem",
            "type": "ios",
            "token": "06546b81450fc50fb3e26e513081f54642d7af3dedb57d9a4c557cc36a81dd252"
        }
    ]
}
```


## Dependencies

  * [node-apn](https://github.com/argon/node-apn)
  * [node-gcm](https://github.com/ToothlessGear/node-gcm)
  * [express](https://github.com/visionmedia/express)
  * [mongoose](https://github.com/LearnBoost/mongoose)
  * [lodash](https://github.com/bestiejs/lodash.git )
  * [commander](https://github.com/visionmedia/commander.js)

## Tags
[node-pushserver tags](https://github.com/Smile-SA/node-pushserver/tags).

## History/Changelog

Take a look at the [history](https://github.com/Smile-SA/node-pushserver/blob/master/HISTORY.md#history).

## License

MIT :

Copyright (C) 2012 Smile Mobile Team

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
