import { hooks as auth } from 'feathers-authentication';
import { hooks } from 'mostly-feathers-mongoose';
import RuleEntity from '~/entities/rule-entity';
import populateRequires from '../../hooks/populate-requires';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        auth.authenticate('jwt')
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
        hooks.populate('level.state', { service: 'states' }),
        hooks.populate('level.point', { service: 'points' }),
        hooks.populate('custom.rules.rewards.metric', { service: 'metrics' }),
        populateRequires(),
        hooks.presentEntity(RuleEntity, options),
        hooks.responder()
      ]
    }
  };
};