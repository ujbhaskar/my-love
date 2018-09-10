/*
*Helpers or Utilities for various tasks
*
*/

//Dependencies
var crypto = require('crypto');
var config = require('./config');

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

//Export the helpers
module.exports = helpers;