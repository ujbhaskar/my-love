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
    }else{
        callback(400, {'Error':'Missing required field'});
    }
};


//Not found handler
handlers.notFound = function(data,callback){
    callback(404);
}

//Export Handlers
module.exports = handlers;
