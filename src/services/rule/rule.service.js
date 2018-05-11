import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import RuleModel from '../../models/rule.model';
import defaultHooks from './rule.hooks';

const debug = makeDebug('playing:rule-services:rules');

const defaultOptions = {
  name: 'rules'
};

export class RuleService extends Service {
  constructor (options) {
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }
}

export default function init (app, options, hooks) {
  options = { ModelName: 'rule', ...options };
  return createService(app, RuleService, RuleModel, options);
}

init.Service = RuleService;
