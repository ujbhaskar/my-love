/*
* Create and export config variables
* NODE_ENV=staging node index.js (in linux)
*
* set NODE_ENV=staging
* node index.js (in windows)
*
*/

//Container for all the environments
var environments = {};

//development env
environments.development = {
    httpPort:3000,
    httpsPort:3001,
    envName:'development',
    hashingSceret:'kdcd@123',
    maxChecks:5
};

//staging (default) env
environments.staging = {
    httpPort:4000,
    httpsPort:4001,
    envName:'staging',
    hashingSceret:'kathgodam',
    maxChecks:5
};

//production (default) env
environments.production = {
    httpPort:5000,
    httpsPort:5001,
    envName:'production',
    hashingSceret:'mayday',
    maxChecks:5
};

//determining environment
var currentEnvironment = typeof(process.env.NODE_ENV)=='string'?process.env.NODE_ENV.toLowerCase():'';

//check environment, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object'?environments[currentEnvironment]:environments.development;

//export the module
module.exports = environmentToExport;