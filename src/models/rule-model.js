import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';
import { models as contents } from 'playing-content-services';

import { requires } from './requires-schema';
import { reward } from './reward-schema';
import { variable } from './variable-schema';

// achievement rules
const achievement = {
  metric: { type: 'ObjectId' },              // id of the set metric
  rules: [{                                  // array of the set metric that the player will gain
    item: {
      name: { type: 'String' },              // name of the set metric
      number: { type: 'Number' },            // number of this item the player would gain
    },
    requires: requires                       // conditions of the achievement
  }]
};

// level rules
const level = {
  point: { type: 'ObjectId' },               // id of the point metric used to calculate the levels
  state: { type: 'ObjectId' },               // id of the state metric which will supply the list of states to be used as levels
  levels: [{                                 // array of the state metric with threshold
    rank: { type: 'String' },                // name of the state metric
    threshold: { type: 'Number' },           // threshold of point metric that is required by the player to gain this level
  }]
};

// custom rules
const custom = {
  rules: [{
    rewards: [reward],                       // set of metrics that a player gets when he finishes this action
    requires: requires                       // conditions of the rewards
  }]
};

/*
 * A rule checks players for certain conditions and performs a specific action
 */
const fields = {
  name: { type: 'String', required: true },  // name for the rule
  description: { type: 'String' },           // brief description of the rule
  type: { type: 'String', enum: [            // type of rule
    'achievement',
    'level',
    'custom'
  ]},
  achievement: achievement,                  // achievement rule
  level: level,                              // level rule
  custom: custom,                            // custom rule
  variables: [variable],                     // variables available within this rule
  tags: [{ type: 'String' }],                // the tags of the rule
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields);
  schema.plugin(timestamps);
  schema.plugin(plugins.softDelete);
  return mongoose.model(name, schema);
}

model.schema = fields;
model.rewards = [reward];
model.requires = requires;
model.variables = [variable];
