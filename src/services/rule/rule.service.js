const assert = require('assert');
const makeDebug = require('debug');
const { Service, createService } = require('mostly-feathers-mongoose');
const fp = require('mostly-func');

const RuleModel = require('../../models/rule.model');
const defaultHooks = require('./rule.hooks');

const debug = makeDebug('playing:rule-services:rules');

const defaultOptions = {
  name: 'rules'
};

class RuleService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

module.exports = function init (app, options, hooks) {
  options = { ModelName: 'rule', ...options };
  return createService(app, RuleService, RuleModel, options);
};
module.exports.Service = RuleService;
