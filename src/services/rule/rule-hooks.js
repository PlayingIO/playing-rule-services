import { hooks } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { cacheMap } from 'mostly-utils-common';

import RuleEntity from '~/entities/rule-entity';
import { populateRequires, populateRewards } from '~/hooks';

const cache = cacheMap({ max: 100 });

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options),
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
        populateRequires('achievement.rules.requires'),
        hooks.populate('level.state', { service: 'states' }),
        hooks.populate('level.point', { service: 'points' }),
        populateRequires('custom.rules.requires'),
        populateRewards('custom.rules.rewards'),
        hooks.presentEntity(RuleEntity, options),
        hooks.responder()
      ]
    }
  };
};