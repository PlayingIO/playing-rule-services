const fp = require('mostly-func');
const { helpers } = require('mostly-feathers-validate');

module.exports = function accepts (context) {
  // validation rules
  const user = { arg: 'user', type: 'string', required: true, description: 'Current user' };
  const variables = { arg: 'variables', type: 'object', default: {}, description: 'Variables of metric' };
  
  return {
    create: [ user, variables ]
  };
};