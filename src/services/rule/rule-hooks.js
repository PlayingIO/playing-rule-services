import { hooks as auth } from 'feathers-authentication';
import { hooks } from 'mostly-feathers-mongoose';
import { cacheMap } from 'mostly-utils-common';
import RuleEntity from '~/entities/rule-entity';
import { populateRequires } from '~/hooks';

const cache = cacheMap({ max: 100 });

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
        hooks.populate('custom.rules.rewards.metric', { service: 'metrics' }),
        populateRequires('*.rules.requires'),
        hooks.presentEntity(RuleEntity, options),
        hooks.responder()
      ]
    }
  };
};