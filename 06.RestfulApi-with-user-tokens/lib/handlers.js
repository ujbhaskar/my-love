/*
* These are the request handlers
*
*/

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');

//define handlers
var handlers = {};

//Ping handler
handlers.ping = function(data,callback){
    //callback a http status code, payload object
    callback(200);
};
//Sample handler
handlers.sample = function(data,callback){
    //callback a http status code, payload object
    callback(200,{'name':'sample handler'});
};

//Users Handlers
handlers.users = (data,callback)=>{
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method)>-1){
        handlers._users[data.method](data,callback);
    }
    else{
        callback(405);
    }
};

//Container for the users submethods
handlers._users = {};

//Users - post
//Required data: firstName, lastName, phone, password, tosAgreement
//Optional Data: None
handlers._users.post = (data,callback)=>{
    //check all the required properties
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length>0 ? data.payload.firstName.trim():false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length>0 ? data.payload.lastName.trim():false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length==10 ? data.payload.phone.trim():false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0 ? data.payload.password.trim():false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement==true ? true:false;
    
    if(firstName && lastName && phone && password && tosAgreement){
        //Make sure that the user doesn't exist
        _data.read('users',phone,(err,data)=>{
            if(err){
                //encrypt password
                password = helpers.hash(password);
                if(password){                
                    // Create user Object
                    var userObj = {
                        firstName,lastName,phone,password,tosAgreement
                    };

                    //Store the user
                    _data.create('users',phone,userObj,err=>{
                        if(!err){
                            callback(200);
                        }
                        else{
                            console.log(err);
                            callback(500,{'Error':'Could not create new user'});
                        }
                    })
                }else{
                    callback(500,{'Error':'Could not hash user password'});
                }
            }else{
                callback(400,{'Error':'A user with phone number already exists'});
            }
        });
    }
    else{
        callback(400,{'Error':'Missing required fields'});
    }
};

//Users get Method
//Required data: phone(query)
// @TODO Only let an authenticated user access their object.
handlers._users.get = (data,callback)=>{
    //Validate phone
    var phone = typeof(data.query.phone) == 'string' && data.query.phone.trim().length == 10?data.query.phone.trim():false;
    
    if(phone){
        //Get the token from the headers
        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20?data.headers.token.trim():false;
        //verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){
                //Lookup the user
                _data.read('users',phone,(err,data)=>{
                    if(!err && data){
                        //Remove the hashedPassword
                        delete data.password;
                        callback(200,data);
                    }else{
                        callback(404,{'Error':'Could not find the specified user'});
                    }
                });

            } else {
                callback(403, {Error:'Missing required token in header or token is invalid'});
            }
        });

    }else{
        callback(400, {'Error':'Missing required field'});
    }
};

//Users put Method
//Required data: phone(query)
//Optional data: firstName, lastName, password (Atleast one must be passed)
//@TODO Only let authenticated user update their own object.
handlers._users.put = (data,callback)=>{
    //Check Optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length>0 ? data.payload.firstName.trim():false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length>0 ? data.payload.lastName.trim():false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length==10 ? data.payload.phone.trim():false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0 ? data.payload.password.trim():false;

    if(phone){
        //Error if nothing is sent to update
        if(firstName || lastName || password){
            //Get the token from the headers
            var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20?data.headers.token.trim():false;
            //verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
                if(tokenIsValid){
                    //Lookup the user
                    _data.read('users',phone,(err,data)=>{
                        if(!err && data){
                            //Update the data back in file
                            if(firstName){
                                data.firstName = firstName;
                            }
                            if(lastName){
                                data.lastName = lastName;
                            }
                            if(password){
                                data.password = helpers.hash(password);;
                            }
                            //Store the data 
                            _data.update('users',phone,data,(err)=>{
                                if(err){
                                    console.log(err);
                                    callback(500,{'Error':'Error while updating the user!!'});
                                }
                                else{
                                    callback(200);
                                }
                            });
                        }else{
                            callback(400,{'Error':'The specified doesn\'t exists'});
                        }
                    });

                } else {
                    callback(403, {Error:'Missing required token in header or token is invalid'});
                }
            });
            

        } else {
            callback(400, {'Error':'Missing fields to update'});
        }
    }else{
        callback(400, {'Error':'Missing required field'});
    }
};

//Users delete Method
//Required data: phone(query)
// @TODO Only let an authenticated user delete their object.
// @TODO Clean everything else created by this user
handlers._users.delete = (data,callback)=>{
    //Validate phone
    var phone = typeof(data.query.phone) == 'string' && data.query.phone.trim().length == 10?data.query.phone.trim():false;

    if(phone){

        
        //Get the token from the headers
        var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20?data.headers.token.trim():false;
        //verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){
                              
                //Lookup the user
                _data.read('users',phone,(err,data)=>{
                    if(!err && data){
                        //Remove the user
                        _data.delete('users',phone,err=>{
                            if(!err){
                                callback(200);
                            } else {
                                callback(500,{'Error':'Error while deleting the user!!'});
                            }
                        })
                    }else{
                        callback(404,{'Error':'Could not find the specified user'});
                    }
                });  

            } else {
                callback(403, {Error:'Missing required token in header or token is invalid'});
            }
        });
    }else{
        callback(400, {'Error':'Missing required field'});
    }
};



//Tokens Handlers
handlers.tokens = (data,callback)=>{
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method)>-1){
        handlers._tokens[data.method](data,callback);
    }
    else{
        callback(405);
    }
};

//Token container
handlers._tokens={};

//Token -- post
//Required data: phone, password
handlers._tokens.post = (data,callback)=>{
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length==10 ? data.payload.phone.trim():false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length>0 ? data.payload.password.trim():false;
    
    if(phone && password){
        // Lookup user to match phone
        _data.read('users',phone,(err,userData)=>{
            if(!err && userData){
                // Hash the sent password and compared with the user's stored password
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.password){
                    //If valid create a new token. Set expiration date 1hr in the future.
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 *60;
                    var tokenObject = {
                        phone:phone,
                        id:tokenId,
                        expires:expires
                    };
                    //Store the token
                    _data.create('tokens',tokenId,tokenObject,(err)=>{
                        if(!err){
                            callback(200,tokenObject);
                        } else {
                            callback(500,{Error:'Could not create the token'});
                        }
                    });
                } else {
                    callback(400, {Error:'Password did not match for the specified user'});
                }
            } else {
                callback(400,{Error:'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {Error:'Missing required fileds'});
    }
};

//Token -- get
// required data: id
handlers._tokens.get = (data,callback)=>{
    //Check that the id is valid
    var id = typeof(data.query.id) == 'string' && data.query.id.trim().length == 20?data.query.id.trim():false;
    
    if(id){
        //Lookup the user
        _data.read('tokens',id,(err,data)=>{
            if(!err && data){
                callback(200,data);
            }else{
                callback(404,{'Error':'Could not find the specified token'});
            }
        });
    }else{
        callback(400, {'Error':'Missing required field'});
    }

};

//Token -- put
// Required data: id, extend
// optional data : null
handlers._tokens.put = (data,callback)=>{
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20?data.payload.id.trim():false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true?true:false;

    if(id && extend){
        //Lookup the token
        _data.read('tokens',id,(err,data)=>{
            if(!err && data){
                //Check to make sure session is not expired
                if(data.expires>Date.now()){
                    data.expires = Date.now() + 1000 * 60 * 60;
                    //Update the session
                    _data.update('tokens', id, data, (err)=>{
                        if(!err){
                            callback(200);
                        } else {
                            callback(500,{Error:'Could not extend token expiration'});
                        }
                    });
                } else {
                    callback(400, {Error:'The token has already expired and cannot be extend'});
                }
            } else {
                callback(400,{'Error':'Token does not exist'});
            }
        })
    } else {
        callback(400, {Error:'Missing required field'});
    }
    
};

//Token -- delete
//Required data: id(query)
// @TODO Only let an authenticated user delete their token.
handlers._tokens.delete = (data,callback)=>{
    var id = typeof(data.query.id) == 'string' && data.query.id.trim().length == 20?data.query.id.trim():false;
    
    if(id){
        //Lookup the user
        _data.read('tokens',id,(err,data)=>{
            if(!err && data){
                //Remove the token
                _data.delete('tokens',id,err=>{
                    if(!err){
                        callback(200);
                    } else {
                        callback(500,{'Error':'Error while deleting the token!!'});
                    }
                })
            }else{
                callback(404,{'Error':'Could not find the specified token'});
            }
        });
    }else{
        callback(400, {'Error':'Missing required field'});
    }
};

//verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id,phone,callback)=>{
    //Lookup the token
    _data.read('tokens',id,(err,data)=>{
        if(!err && data){
            //Check that the token is for the given user and hasn't expires
            console.log('phone : ' , phone);
            console.log('data : ' , data);
            console.log('data.phone == phone : ', (data.phone == phone));
            console.log('data.expires > Date.now() : ', (data.expires > Date.now()));
            if(data.phone == phone && data.expires > Date.now()){
                console.log('pass1');
                callback(true);
            }
            else{
                console.log('fail1');
                callback(false);
            }
        } else {
            console.log('fail2');
            callback(false);
        }
    });
};

//Not found handler
handlers.notFound = function(data,callback){
    callback(404);
}

//Export Handlers
module.exports = handlers;
