import assert from 'assert';
import makeDebug from 'debug';
import { Service as BaseService } from 'mostly-feathers';
import { helpers } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { helpers as metrics } from 'playing-metric-services';

import defaultHooks from './user-rule.hooks';
import {
  getAllVariables,
  fulfillAchievementRewards,
  fulfillLevelRewards,
  fulfillCustomRewards
} from '../../helpers';

const debug = makeDebug('playing:user-rules-services:user-rules');

const defaultOptions = {
  name: 'user-rules'
};

class UserRuleService extends BaseService {
  constructor (options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * rules process for current player
   */
  async create (data, params) {
    assert(data.user, 'data.user not provided');
    assert(params.user && params.user.scores, 'params.user.scores not provided');
    data.variables = data.variables || {};

    const svcRules = this.app.service('rules');
    const svcUserMetrics = this.app.service('user-metrics');

    // get available rules
    const getRules = () => svcRules.find({
      query: { $select: [
        'achievement.metric',
        'level.state',
        'level.point',
        'custom.rules.rewards',
        '*'
      ]},
      paginate: false
    });

    // process achivement rule
    const processAchievement = async (achievement, variables) => {
      if (achievement.metric) {
        assert(achievement.metric.type, 'metric of achievement rule has not populated for process');
        assert(achievement.metric.type === 'set', 'metric of achievement rule must be a set metric');
        if (achievement.rules) {
          const rewards = fulfillAchievementRewards(achievement, params.user);
          return metrics.createUserMetrics(this.app)(data.user, rewards || [], variables);
        }
      }
      return [];
    };

    // process level rule
    const processLevel = async (level, variables) => {
      if (level.state && level.point) {
        assert(level.state.type && level.point.type, 'state or point of level rule has not populated for process');
        assert(level.state.type === 'state', 'state of level rule must be a state metric');
        assert(level.point.type === 'point', 'point of level rule must be a point metric');
        if (level.levels) {
          const rewards = fulfillLevelRewards(level, params.user);
          return metrics.createUserMetrics(this.app)(data.user, rewards || [], variables);
        }
      }
      return [];
    };

    // process custom rule
    const processCustom = async (custom, variables) => {
      if (custom.rules) {
        const rewards = fulfillCustomRewards(custom.rules, variables, params.user);
        return metrics.createUserMetrics(this.app)(data.user, rewards || [], variables);
      }
      return [];
    };

    const rules = await getRules();
    const results = await Promise.all(fp.flatMap(rule => {
      const variables = getAllVariables(data.variables, rule.variables);
      switch (rule.type) {
        case 'achievement': return processAchievement(rule.achievement, variables);
        case 'level': return processLevel(rule.level, variables);
        case 'custom': return processCustom(rule.custom, variables);
      }
    }, rules));
    return results;
  }
}

export default function init (app, options, hooks) {
  return new UserRuleService(options);
}

init.Service = UserRuleService;
