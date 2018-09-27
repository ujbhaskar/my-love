/*
* Server related tasks
*
*/

//dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var _data = require('./data');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');

//Instantiate the server module object
var server = {};

//TODO delete later
// helpers.sendTwilioSms('7864864885','Test message for the Twilio api',err=>{
//     console.log('this was the Twilio error: ', err);
// });

//TESTING
// @TODO delete this
// _data.create('test','myData',{'a':1,'b':2},(err)=>{
//    console.log('err: ' ,err);
// });

// _data.read('test','myData',(err,data)=>{
//     console.log('reading err: ' , err);
//     console.log('reading data: ' , data);
// });

// _data.update('test','myData',{'a':1,'b':2,'c':3},(err)=>{
//     console.log('err: ' ,err);
//  });

// _data.delete('test','myData',err=>{
//     console.log('err for delete file is : ' , err);
// })

//Instantiating http Server
server.httpServer = http.createServer((req,res)=>{
    server.unifiedServer(req,res);
});

//create https Option
server.httpsServerOptions = {
    key: fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
//Instantiate https server
server.httpsServer = https.createServer(server.httpsServerOptions,(req,res)=>{
    server.unifiedServer(req,res);
});


//All the server logic for both http and https
server.unifiedServer = function(req,res){
    //get the url and parse it
    var parsedURL = url.parse(req.url,true);
    
    //get the path
    var path = parsedURL.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    //get the query 
    var query = parsedURL.query;

    //get the method
    var method = req.method.toLowerCase();

    //get the headers
    var headers = req.headers;

    //get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',(data)=>{
        buffer += decoder.write(data);
    });
    req.on('end',()=>{
        buffer += decoder.end();

        //choose the handler this request should go
        var choosenHandler = typeof(server.router[trimmedPath])!== 'undefined'? server.router[trimmedPath] : handlers.notFound;

        //construct the data object to send to the handler
        var data = {
            trimmedPath:trimmedPath,
            query:query,
            method:method,
            headers:headers,
            payload:helpers.parseJsonToObject(buffer)
        };
        choosenHandler(data,function(statusCode,payload){
            //use the status code called or default 200
            statusCode = typeof(statusCode)=='number'?statusCode:200;

            //use the payload called by handler, or default to empty obj
            payload = typeof(payload)=='object'?payload:{};

            //Convert the payload to STring
            var payloadString = JSON.stringify(payload);
            console.log(method, ':', trimmedPath, 'statusCode: ', statusCode , 'payload: ', payload);
            //return the response
            res.setHeader('Content-Type','application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept,Authorization');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
            res.writeHead(statusCode);
            res.end(payloadString);
        });

    });    
};

//define a request router
server.router = {
    sample: handlers.sample,
    ping:handlers.ping,
    users:handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
};


// Init the server
server.init = ()=>{
    //Start the http server and listen on port 3000/getting port from config
    server.httpServer.listen(config.httpPort,()=>{
        console.log('HTTP server is listening on port: '+config.httpPort+ ' in '+config.envName+ ' mode');
    });

    //Start the https server
    server.httpsServer.listen(config.httpsPort,()=>{
        console.log('HTTPS server is listening on port: '+config.httpsPort+ ' in '+config.envName+ ' mode');
    });
}

//Export the server module
module.exports = server;
