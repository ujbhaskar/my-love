/*
* Primary file for the API
*
*/

//dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var _data = require('./lib/data');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

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
var httpServer = http.createServer((req,res)=>{
    unifiedServer(req,res);
});

//Start the http server and listen on port 3000/getting port from config
httpServer.listen(config.httpPort,()=>{
    console.log('HTTP server is listening on port: '+config.httpPort+ ' in '+config.envName+ ' mode');
});

//create https Option
var httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};
//Instantiate https server
var httpsServer = https.createServer(httpsServerOptions,(req,res)=>{
    unifiedServer(req,res);
});
//Start the https server
httpsServer.listen(config.httpsPort,()=>{
    console.log('HTTPS server is listening on port: '+config.httpsPort+ ' in '+config.envName+ ' mode');
});

//All the server logic for both http and https
var unifiedServer = function(req,res){
    console.log('in unifiedServer');
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
        console.log('data on buffer : ' , data);
        buffer += decoder.write(data);
    });
    req.on('end',()=>{
        buffer += decoder.end();

        //choose the handler this request should go
        var choosenHandler = typeof(router[trimmedPath])!== 'undefined'? router[trimmedPath] : handlers.notFound;

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

            //return the response
            res.setHeader('Content-Type','application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept,Authorization');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log('statusCode: ', statusCode);
            console.log('payloadString: ', payloadString);
        });

    });    
};

//define a request router
var router = {
    'sample': handlers.sample,
    'ping':handlers.ping,
    'users':handlers.users,
    'tokens': handlers.tokens
};