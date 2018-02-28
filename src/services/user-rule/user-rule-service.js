import assert from 'assert';
import makeDebug from 'debug';
import { Service as BaseService } from 'mostly-feathers';
import fp from 'mostly-func';
import defaultHooks from './user-rule-hooks';
import { fulfillAchievementRewards } from '../../helpers';

const debug = makeDebug('playing:user-rules-services:user-rules');

const defaultOptions = {
  name: 'user-rules'
};

class UserRuleService extends BaseService {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);
  }

  setup(app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  /**
   * rules process for current player
   */
  create(data, params) {
    params = params || { query: {} };
    assert(data.user, 'params.user not provided');

    const svcRules = this.app.service('rules');
    const svcUserMetrics = this.app.service('user-metrics');

    // get available rules
    const getRules = () => svcRules.find({
      query: { $select: [
        'achievement.metric',
        'level.state',
        'level.point',
        'custom.rules.requires.metric',
        'custom.rules.rewards.metric',
        '*.rules.requires',
        '*'
      ]},
      paginate: false
    });

    const createRewards = fp.reduce((arr, reward) => {
      if (reward.metric) {
        reward.metric = reward.metric.id || reward.metric;
        reward.user = data.user;
        arr.push(svcUserMetrics.create(reward));
      }
      return arr;
    }, []);

    const processAchievement = (achievement, variables) => {
      if (achievement.metric) {
        assert(achievement.metric.type, 'metric of achievement rule has not populated for process');
        assert(achievement.metric.type === 'set', 'metric of achievement rule must be a set metric');
        if (achievement.rules) {
          const rewards = fulfillAchievementRewards(achievement);
          if (rewards.length > 0) {
            return Promise.all(createRewards(rewards));
          }
        }
      }
      return Promise.resolve(null);
    };

    const processLevel = (achievement, variables) => {
      return Promise.resolve(null);
    };

    const processCustom = (achievement, variables) => {
      return Promise.resolve(null);
    };

    return getRules().then(results => {
      return Promise.all(fp.map(rule => {
        switch (rule.type) {
          case 'achievement': return processAchievement(rule.achievement, rule.variables);
          case 'level': return processLevel(rule.level, rule.variables);
          case 'custom': return processCustom(rule.custom, rule.variables);
        }
      }, results));
    });
  }
}

export default function init(app, options, hooks) {
  return new UserRuleService(options);
}

init.Service = UserRuleService;
