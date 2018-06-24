import { plugins } from 'mostly-feathers-mongoose';
import { models as contents } from 'playing-content-services';
import { schemas } from 'playing-rule-common';

const options = {
  timestamps: true
};

/**
 * Achievement rules
 */
const achievement = {
  metric: { type: 'ObjectId' },            // id of the set metric
  rules: [{                                // array of the set metric that the player will gain
    _id: false,
    item: {
      name: { type: String },              // name of the set metric
      number: { type: Number },            // number of the item the player would gain
    },
    requires: schemas.requires.schema      // conditions of the achievement
  }]
};

// level rules
const level = {
  point: { type: 'ObjectId' },             // id of the point metric used to calculate the levels
  state: { type: 'ObjectId' },             // id of the state metric which will supply the list of states to be used as levels
  levels: [{                               // array of the state metric with threshold
    _id: false,
    rank: { type: String },                // name of the state metric
    threshold: { type: Number },           // threshold of point metric that is required by the player to gain this level
  }]
};

// custom rules
const custom = {
  rules: [{
    _id: false,
    rewards: schemas.rewards.schema,       // set of metrics that a player gets when he finishes the action
    requires: schemas.requires.schema      // conditions of the rewards
  }]
};

/*
 * A rule checks players for certain conditions and performs a specific action
 */
const fields = {
  name: { type: String, required: true },  // name for the rule
  description: { type: String },           // brief description of the rule
  type: { type: String, enum: [            // type of rule
    'achievement',
    'level',
    'custom'
  ]},
  achievement: achievement,                // achievement rule
  level: level,                            // level rule
  custom: custom,                          // custom rule
  variables: schemas.variables.schema,     // variables available within the rule
  rate: schemas.rate.schema,               // rate limiting of the rule
  tags: [{ type: String }],                // the tags of the rule
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(plugins.trashable);
  return mongoose.model(name, schema);
}

model.schema = fields;
