require = require("esm")(module/*, options*/);
console.time('playing-rule-services import');
module.exports = require('./src/index').default;
module.exports.entities = require('./src/entities').default;
module.exports.models = require('./src/models').default;
module.exports.hooks = require('./src/hooks');
module.exports.helpers = require('./src/helpers');
console.time('playing-rule-services import');
