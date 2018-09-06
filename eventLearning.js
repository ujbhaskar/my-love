
const Logger = require('./logger');
const logger = new Logger();


logger.on('messageLogged',function(args){
    console.log('messageLogged : ' , args);
})

logger.log('message');