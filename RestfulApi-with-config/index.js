/*
* Primary file for the API
*
*/

//dependencies
const http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

//variables
var tick = 0;

//The server should respond to all request with a string
const server = http.createServer((req,res)=>{
    //get the url and parse it
    var parsedURL = url.parse(req.url,true);

    //get the path
    var path = parsedURL.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    //get the query 
    var queryStringObject = parsedURL.query;

    //get the method
    var method = req.method;

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
            queryStringObject:queryStringObject,
            method:method,
            headers:headers,
            payload:buffer
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
        //route the request to the handler specified in the router


        //send the response
        // res.write('\nquery is : ' + JSON.stringify(queryStringObject));
        //res.end('Hello World');

        //log the request path
        // console.log('===========================================================');
        // console.log('requested URL: ' , req.url);
        // console.log('requested method: ' , req.method);
        // console.log('requested path: ' , trimmedPath);
        // console.log('requested query: ' , queryStringObject);
        // console.log('requested headers: ' , headers);
        // console.log('requested payload: ' , buffer);
        // console.log('////////////////////////////////////////////////////////////');


    });    
});

//Start the server and listen on port 3000/getting port from config
server.listen(config.port,()=>{
    console.log('server is listening on port: '+config.port+ ' in '+config.envName+ ' mode');
});

//define handlers
var handlers = {};

//Sample handler
handlers.sample = function(data,callback){
    //callback a http status code, payload object
    callback(200,{'name':'sample handler'});
};

//Not found handler
handlers.notFound = function(data,callback){

    callback(404);
}
//define a request router
var router = {
    'sample': handlers.sample
};