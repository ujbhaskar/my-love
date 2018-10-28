/*
* Workers related tasks
*
*/

//dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var _data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var fs = require('fs');
var path = require('path');

//Instantiate the worker module object
var workers = {};

//Lookup all checks, get their data, send to a validator
workers.gatherAllChecks = ()=>{
    //Get all the checks
    _data.list('checks',(err,checks)=>{
        if(!err && checks.length>0){
            checks.forEach(check=>{
                //Read the check data
                _data.read('checks',check,(err,checkData)=>{
                    if(!err && checkData){
                        //pass the data to the check validator, and let that function continue or log error
                        workers.validateCheckData(checkData);
                    } else {
                        console.log('Error reading checkData for :', check);
                    }
                });
            });
        } else {
            console.log('Error :could not find any checks to process');
        }
    })
};

// Sanity-check of the check data
workers.validateCheckData = (checkData)=>{
    checkData = typeof(checkData) == 'object' && checkData !== null?checkData:{};
    checkData.id = typeof(checkData.id) == 'string' && checkData.id.trim().length == 20?checkData.id.trim():false;
    checkData.userPhone = typeof(checkData.userPhone) == 'string' && checkData.userPhone.trim().length == 10?checkData.userPhone.trim():false;
    checkData.protocol = typeof(checkData.protocol) == 'string' && ['http','https'].indexOf(checkData.protocol.trim()) >=0 ?checkData.protocol.trim():false;
    checkData.url = typeof(checkData.url) == 'string' && checkData.url.trim().length >=0 ?checkData.url.trim():false;
    checkData.method = typeof(checkData.method) == 'string' && ['post', 'put', 'get','delete'].indexOf(checkData.method.trim()) >=0 ?checkData.method.trim():false;
    checkData.successCodes = typeof(checkData.successCodes) == 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length>0 ?checkData.successCodes:false;    
    checkData.timeoutSeconds = typeof(checkData.timeoutSeconds) == 'number' && checkData.timeoutSeconds % 1 == 0 &&  checkData.timeoutSeconds>=1 && checkData.timeoutSeconds<=5 ?checkData.timeoutSeconds:false;

    //Set the key that may not be set (if the workers have never seen this check before)
    checkData.state = typeof(checkData.state) == 'string' && ['up','down'].indexOf(checkData.state.trim()) >=0 ?checkData.state.trim():'down';
    checkData.lastChecked = typeof(checkData.lastChecked) == 'number' && checkData.lastChecked >0 ?checkData.lastChecked:false;
    
    //If all the checks pass, pass the data along to the next step in the process.
    if( checkData.id && 
        checkData.userPhone &&
        checkData.protocol &&
        checkData.url &&
        checkData.method &&
        checkData.timeoutSeconds && 
        checkData.successCodes){
        
        //perform check
        workers.performCheck(checkData);

    } else {
        console.log('one of the checks is not properly formatted, Skipping it');
    }

};


//Perform the check, send the originalCheckData and the outcome of the check process, to the next step in the process
workers.performCheck = (checkData)=>{
    //perpare the initial check outcome
    var checkOutcome = {
        error:false,
        responseCode:false
    };

    //Mark that the outcome hasn't been sent yet
    var outcomeSent = false;

    //Parse the hostname and path from the original Check Data
    var parsedUrl = url.parse(checkData.protocol+'://'+checkData.url,true);
    var hostname = parsedUrl.hostname;
    //hostname = hostname==='localhost'?'localhost:3000':hostname;
    console.log('hostname--------------->',hostname);
    
    var path = parsedUrl.path; //Using path and not pathname because we want the query string


    //Costruct the request
    var requestDetails = {
        'protocol': checkData.protocol+':',
        'hostname' : hostname,
        'method': checkData.method.toUpperCase(),
        'path':path,
        'timeout': checkData.timeoutSeconds * 1000
    };
    console.log('going to request: ', requestDetails);
    //Instantiate the request object using either http/https module
    var _moduleToUse = checkData.protocol == 'http'?http:https;
    var req = _moduleToUse.request(requestDetails,res=>{
        //Grab the status of the sent request
        var status = res.statusCode;
        console.log('got status:', status, 'path: ', path);
        //update the check outcome and pass the data along
        checkOutcome.responseCode = status;
        if(!outcomeSent){
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }

    });

    //Bind to the error event so it doesn't get thrown
    req.on('error',(e)=>{
        console.log('in error:', e);
        //update the check outcome and pass the data along
        checkOutcome.error = {
            error:true,
            value:e
        };
        if(!outcomeSent){
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the timeout event
    req.on('timeout',(e)=>{
        //update the check outcome and pass the data along
        checkOutcome.error = {
            error:true,
            value:'timeout'
        };
        if(!outcomeSent){
            workers.processCheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    //End the request
    req.end();
};


//Process the checkoutcome and update the data as needed, trigger an alert if needed
//Special logic for accomodating a check that has never been tested before
workers.processCheckOutcome = (checkData, checkOutcome)=>{
    //Decide if the check is up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && checkData.successCodes.indexOf(checkOutcome.responseCode)>=-1?'up':'down';
    console.log('state: ', state);

    //Decide if an alert is warranted
    var alertWarranted = checkData.lastChecked && checkData.state != state?true:false;
    console.log('alertWarranted: ', alertWarranted);

    //update the checkData
    var newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    //Save the updates
    _data.update('checks', newCheckData.id,newCheckData,err=>{
        if(!err){
            //Send the new checkData to the next phase in the process if needed
            if(alertWarranted){
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('CHeckoutcome hasnot changed, no alert needed');
            }
        } else {
            console.log('Error trying to save updates o one of the checks');
        }
    });


};

//Alert the user as to a change in their check status
workers.alertUserToStatusChange=(newCheckData)=>{
    var message = 'Alert!! Your check for '+newCheckData.method.toUpperCase()+' '+newCheckData.protocol+'://'+newCheckData.url+' is currently '+newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone, message, err=>{
        if(!err){
            console.log('Success: User was alerted to a status change in their check, via sms: ' , message);
        } else {
            console.log('Error: Could not send sms alert to user who had a state change in their check');
        }
    });
};

//Timer to execute the worker -process once per min
workers.loop = ()=>{
    setInterval(()=>{
        workers.gatherAllChecks();
    },1000 * 60);
}

// Init the worker
workers.init = ()=>{
    // _data.list('checks',(err,data)=>{
    //     console.log(err);
    //     console.log(data);
    // });
    // console.log('in worker init function');

    //Execute all the checks immediately
    workers.gatherAllChecks();

    //Call the loop so that the checks will execute later on
    workers.loop();
}

//Export the worker module
module.exports = workers;