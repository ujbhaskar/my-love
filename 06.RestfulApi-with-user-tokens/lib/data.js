/*
* Library for storing and editing data
*
*/

//Dependencies
var fs = require('fs'),
    path = require('path'),
    helpers = require('./helpers');


// Container for the module to be exported
var lib = {};

//base dir of data folder
lib.baseDir = path.join(__dirname,'../.data/');

//Write data to a file
lib.create = (dir,filename,data,callback)=>{
    //Open the file for writing
    fs.open(lib.baseDir+dir+'/'+filename+'.json','wx',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            //Convert data to string
            var stringData = JSON.stringify(data);
            
            //write to file and close it
            fs.writeFile(fileDescriptor,stringData,(err)=>{
                if(!err){
                    fs.close(fileDescriptor,(err)=>{
                        if(!err){
                            callback(false);
                        } else{
                            callback('Error closing new File');
                        }
                    });
                } else{
                    callback('Error on writing to new file');
                }
            });
        } else{
            callback('Could not create new file, it may already exist');
        }

    });
}

//Read data from a file
lib.read = (dir,file,callback)=>{
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',(err,data)=>{
        if(!err && data){
            var parsedData = helpers.parseJsonToObject(data);
            callback(false,parsedData);
        }
        else{
            callback(err,data);
        }
    })
};

//Update data in a file
lib.update = (dir,filename,data,callback)=>{
    //Open the file
    fs.open(lib.baseDir+dir+'/'+filename+'.json','r+',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);

            //Truncate the file
            fs.truncate(fileDescriptor,(err)=>{
                if(!err){
                    //write to file and close it
                    fs.writeFile(fileDescriptor,stringData,(err)=>{
                        if(!err){
                            fs.close(fileDescriptor,(err)=>{
                                if(!err){
                                    callback(false);
                                } else{
                                    callback('Error closing while updating File');
                                }
                            });
                        } else{
                            callback('Error on writing to existing file');
                        }
                    });
                } else{
                    callback('Error truncating file');
                }
            })
        } else{
            callback('Could not open the file for updating, it may not exist yet');
        }
    })
};

//Delete a file
lib.delete = (dir,filename,callback)=>{
    //Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+filename+'.json',(err)=>{
        callback(err);
    })
}

//export module
module.exports = lib;