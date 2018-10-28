/*
*Helpers or Utilities for various tasks
*
*/

//Dependencies
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var queryString = require('querystring');
//Container for the helpers
var helpers = {};

//Create a SHA256 Hash 
helpers.hash = (str)=>{
    if(typeof(str)=='string' && str.length > 0){
        var hash = crypto.createHmac('sha256',config.hashingSceret).update(str).digest('hex');
        return hash;
    }
    else{
        return flase;
    }
};

//Converts String to JSON Object
helpers.parseJsonToObject = (bufferStr)=>{
    try{
        var obj = JSON.parse(bufferStr);
        return obj;
    }catch(e){
        return {};
    }
}

//Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength)=>{
    strLength = typeof(strLength) == 'number' && strLength >0?strLength:false;
    if(strLength){
        // Define all the possible characters 
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        //Start the string
        var str = '';
        for ( var i = 0; i<strLength;i++){
            str += possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
        }
        return str;
    } else {
        return false;
    }
};


// Send an SMS message via twilio
helpers.sendTwilioSms = (phone,message,callback)=>{
    //Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10? phone.trim():false;
    message = typeof(message) == 'string' && message.trim().length > 0 && message.trim().length <= 1600? message.trim():false;

    if(phone && message){
        // Configure the request payload
        var payload = {
            From: config.twilio.fromPhone,
            To: '+91'+phone,
            Body: message
        }

        // Stringify the payload
        var stringPayload = queryString.stringify(payload);

        //Configure the request details
        var requestDetails = {
            protocol:'https:',
            hostname:'api.twilio.com',
            method:'POST',
            path:'/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            auth:config.twilio.accountSid+':'+config.twilio.authToken,
            headers:{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':Buffer.byteLength(stringPayload)
            }
        };

        //Instantiate the request object
        var req = https.request(requestDetails,res=>{
            //Grab the status of the sent request
            var status = res.statusCode;
            console.log('status = ', status);
            if(status == 200 || status == 201){
                callback(false);
            } else {
               callback('StatusCode returned was: ', status) ;
            }
        });

        //Bind to the error event inorder to avoid getting thrown
        req.on('error',err=>{
            callback(err);
        });

        // Add the payload
        req.write(stringPayload);

        //End the request
        req.end();
    } else {
        callback('Given parameters were missing or invalid');
    }
    
}

//Export the helpers
module.exports = helpers;