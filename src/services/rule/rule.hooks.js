import { hooks } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';
import { cache } from 'mostly-feathers-cache';
import rules from 'playing-rule-common';

import RuleEntity from '../../entities/rule.entity';

export default function (options = {}) {
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
        rules.populateRequires('achievement.rules.requires'),
        hooks.populate('level.state', { service: 'states' }),
        hooks.populate('level.point', { service: 'points' }),
        rules.populateRequires('custom.rules.requires'),
        rules.populateRewards('custom.rules.rewards'),
        cache(options.cache),
        hooks.presentEntity(RuleEntity, options.entities),
        hooks.responder()
      ]
    }
  };
}