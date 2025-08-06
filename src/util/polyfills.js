if (typeof global.atob === 'undefined') {
  global.atob = function (str) {
    return Buffer.from(str, 'base64').toString('binary');
  };
}
if (typeof global.btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
if (typeof global.self === 'undefined') {
  global.self = global;
}
