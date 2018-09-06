/*
* Primary file for the API
*
*/

//dependencies
const http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
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

        //send the response
        // res.write('\nquery is : ' + JSON.stringify(queryStringObject));
        res.end('Hello World');

        //log the request path
        console.log('===========================================================');
        console.log('requested URL: ' , req.url);
        console.log('requested method: ' , req.method);
        console.log('requested path: ' , trimmedPath);
        console.log('requested query: ' , queryStringObject);
        console.log('requested headers: ' , headers);
        console.log('requested payload: ' , buffer);
        console.log('////////////////////////////////////////////////////////////');
    });    
});

//Start the server and listen on port 3000
server.listen(3000,()=>{
    console.log('server is listening on port 3000');
});