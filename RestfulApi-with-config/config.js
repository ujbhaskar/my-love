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
    port:3000,
    envName:'development'
};

//staging (default) env
environments.staging = {
    port:8090,
    envName:'staging'
};

//production (default) env
environments.production = {
    port:8080,
    envName:'production'
};

//determining environment
var currentEnvironment = typeof(process.env.NODE_ENV)=='string'?process.env.NODE_ENV.toLowerCase():'';

//check environment, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object'?environments[currentEnvironment]:environments.development;

//export the module
module.exports = environmentToExport;