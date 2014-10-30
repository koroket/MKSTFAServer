/*
Name           messagebird.js
Description:   Unofficial MessageBird module for Node.js
Author:        Franklin van de Meent (https://frankl.in)
Sourcecode:    https://github.com/fvdm/nodejs-messagebird
Feedback:      https://github.com/fvdm/nodejs-messagebird/issues
Service:       MessageBird (https://www.messagebird.com)
License:       Unlicense / Public Domain
               (https://raw.github.com/fvdm/nodejs-messagebird/master/LICENSE)
*/

var https = require('https').request
var querystring = require('querystring').stringify
var xml2json = require('node-xml2json')

// Defaults
module.exports = {
	username: null,
	password: null,
	timeout: 5000	// milliseconds
}

// Send SMS
module.exports.sms = function( sender, destination, body, vars, callback ) {
	if( typeof vars === 'function' ) {
		var callback = vars
		var vars = {}
	}
	
	if( typeof destination.join === 'function' ) {
		destination = destination.join(',')
	}
	
	if( sender ) {
		vars.sender = sender
	}
	
	vars.destination = destination
	vars.body = body
	vars.responsetype = 'XML'
	
	talk( 'sms', vars, callback )
}

// HLR lookup
module.exports.hlr = function( recipients, reference, callback ) {
	if( typeof reference === 'function' ) {
		var callback = reference
		reference = null
	}
	
	if( typeof recipients.join === 'function' ) {
		recipients = recipients.join(',')
	}
	
	var vars = {recipients: recipients}
	if( reference ) {
		vars.reference = reference
	}
	
	talk( 'hlr', vars, callback )
}

// Credits
module.exports.credits = function( callback ) {
	talk( 'credits', callback )
}


// Communicate
function talk( path, fields, callback ) {
	if( typeof fields === 'function' ) {
		var callback = fields
	}
	if( typeof fields !== 'object' ) {
		var fields = {}
	}
	
	// prevent multiple callbacks
	var complete = false
	function doCallback( err, res ) {
		if( ! complete ) {
			complete = true
			callback( err, res || null )
		}
	}
	
	// build request
	fields.username = module.exports.username
	fields.password = module.exports.password
	
	var query = querystring( fields )
	
	var options = {
		hostname: 'api.messagebird.com',
		path: '/api/'+ path,
		method: 'POST',
		headers: {
			'User-Agent': 'messagebird.js (https://github.com/fvdm/nodejs-messagebird)',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': query.length
		}
	}
	
	var request = https( options )
	
	// response
	request.on( 'response', function( response ) {
		var data = ''
		
		response.on( 'data', function( ch ) { data += ch })
		response.on( 'close', function() { doCallback( new Error('request closed') ) })
		
		response.on( 'end', function() {
			if( response.statusCode === 200 ) {
				try {
					data = xml2json.parser( data )
					data = data.response.item || data
					if( ! data.credits && (data.responsecode != 1 || data.responsemessage !== 'OK') ) {
						var err = new Error('api error')
						err.statusCode = response.statusCode
						err.responsecode = data.responsecode
						err.responsemessage = data.responsemessage
						doCallback( err )
					} else {
						doCallback( null, data )
					}
				} catch( e ) {
					var err = new Error('api invalid')
					err.error = e
					doCallback( err )
				}
			} else {
				var err = new Error('api http error')
				err.statusCode = response.statusCode
				err.body = data || null
				doCallback( err )
			}
		})
	})
	
	// error
	request.on( 'error', function( error ) {
		if( error.code === 'ECONNRESET' ) {
			var err = new Error('request timeout')
		} else {
			var err = new Error('request failed')
		}
		err.error = error
		doCallback( err )
	})
	
	// timeout
	request.on( 'socket', function( socket ) {
		socket.setTimeout( module.exports.timeout )
		socket.on( 'timeout', function() {
			request.abort()
		})
	})
	
	// run it
	request.end( query )
}
