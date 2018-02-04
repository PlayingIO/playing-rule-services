import assert from 'assert';
import makeDebug from 'debug';
import { Service, helpers, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import RuleModel from '~/models/rule-model';
import defaultHooks from './rule-hooks';

const debug = makeDebug('playing:actions-services:rules');

const defaultOptions = {
  name: 'rules'
};

class RuleService extends Service {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

export default function init(app, options, hooks) {
  options = Object.assign({ ModelName: 'rule' }, options);
  return createService(app, RuleService, RuleModel, options);
}

init.Service = RuleService;
