import assert from 'assert';
import makeDebug from 'debug';
import { Service as BaseService, helpers } from 'mostly-feathers';
import fp from 'mostly-func';
import defaultHooks from './user-rule-hooks';
import { fulfillAchievementRewards, fulfillLevelRewards, fulfillCustomRewards } from '../../helpers';

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
    assert(data.user, 'data.user not provided');
    assert(params.user && params.user.scores, 'params.user.scores not provided');

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

    // create rewards
    const createRewards = fp.reduce((arr, reward) => {
      if (reward.metric) {
        reward.metric = helpers.getId(reward.metric);
        reward.user = data.user;
        arr.push(svcUserMetrics.create(reward));
      }
      return arr;
    }, []);

    // process achivement rule
    const processAchievement = (achievement, variables) => {
      if (achievement.metric) {
        assert(achievement.metric.type, 'metric of achievement rule has not populated for process');
        assert(achievement.metric.type === 'set', 'metric of achievement rule must be a set metric');
        if (achievement.rules) {
          const rewards = fulfillAchievementRewards(achievement, params.user);
          return Promise.all(createRewards(rewards || []));
        }
      }
      return Promise.resolve(null);
    };

    // process level rule
    const processLevel = (level, variables) => {
      if (level.state && level.point) {
        assert(level.state.type && level.point.type, 'state or point of level rule has not populated for process');
        assert(level.state.type === 'state', 'state of level rule must be a state metric');
        assert(level.point.type === 'point', 'point of level rule must be a point metric');
        if (level.levels) {
          const rewards = fulfillLevelRewards(level, params.user);
          return Promise.all(createRewards(rewards || []));
        }
      }
      return Promise.resolve(null);
    };

    // process custom rule
    const processCustom = (custom, variables) => {
      if (custom.rules) {
        const rewards = fulfillCustomRewards(custom.rules, variables, params.user);
        return Promise.all(createRewards(rewards || []));
      }
      return Promise.resolve(null);
    };

    return getRules().then(results => {
      return Promise.all(fp.map(rule => {
        switch (rule.type) {
          case 'achievement': return processAchievement(rule.achievement, rule.variables);
          case 'level': return processLevel(rule.level, rule.variables);
          case 'custom': return processCustom(rule.custom, rule.variables);
        }
      }, results)).then(fp.flatten);
    });
  }
}

export default function init(app, options, hooks) {
  return new UserRuleService(options);
}

init.Service = UserRuleService;
