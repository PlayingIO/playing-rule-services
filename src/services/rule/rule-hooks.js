import { hooks as auth } from 'feathers-authentication';
import { hooks } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { cacheMap } from 'mostly-utils-common';

import RuleEntity from '~/entities/rule-entity';
import { populateRequires, populateRewards } from '~/hooks';

const cache = cacheMap({ max: 100 });

const getRuleRequires = fp.reduce((arr, rule) => {
  if (rule.type === 'achievement') {
    return arr.concat(fp.map(fp.prop('requires'), rule.achievement.rules || []));
  } else if (rule.type === 'custom') {
    return arr.concat(fp.map(fp.prop('requires'), rule.custom.rules || []));
  }
  return arr;
}, []);

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        auth.authenticate('jwt'),
        hooks.cache(cache)
      ],
      get: [],
      find: [],
      create: [],
      update: [],
      patch: [],
      remove: [],
    },
    after: {
      all: [
        hooks.cache(cache),
        hooks.populate('achievement.metric', { service: 'sets' }),
        hooks.populate('level.state', { service: 'states' }),
        hooks.populate('level.point', { service: 'points' }),
        populateRequires('*.rules.requires', getRuleRequires),
        populateRewards('custom.rules.rewards'),
        hooks.presentEntity(RuleEntity, options),
        hooks.responder()
      ]
    }
  };
};