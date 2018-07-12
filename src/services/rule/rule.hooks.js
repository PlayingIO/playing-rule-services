const { hooks } = require('mostly-feathers-mongoose');
const fp = require('mostly-func');
const { cache } = require('mostly-feathers-cache');
const rules = require('playing-rule-common');

const RuleEntity = require('../../entities/rule.entity');

module.exports = function (options = {}) {
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
};