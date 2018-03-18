import { hooks } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { cache } from 'mostly-feathers-cache';

import RuleEntity from '~/entities/rule.entity';
import { populateRequires, populateRewards } from '~/hooks';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options.auth),
        cache(options.cache)
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
        hooks.populate('achievement.metric', { service: 'sets' }),
        populateRequires('achievement.rules.requires'),
        hooks.populate('level.state', { service: 'states' }),
        hooks.populate('level.point', { service: 'points' }),
        populateRequires('custom.rules.requires'),
        populateRewards('custom.rules.rewards'),
        cache(options.cache),
        hooks.presentEntity(RuleEntity, options),
        hooks.responder()
      ]
    }
  };
};