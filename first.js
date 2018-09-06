const path = require('path');
const os = require('os');

console.log(path);
console.log('///////////');
console.log(path.posix.delimiter);

const pathObj = path.parse(__filename);
console.log(pathObj.base);

console.log(os.totalmem());
console.log(os.freemem());
