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

//Export the helpers
module.exports = helpers;