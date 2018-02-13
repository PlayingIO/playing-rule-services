// reward structure
const reward = {
  metric: {                                // the metric which will be used for the reward
    id: { type: 'ObjectId' },              // ID of the metric
    type: { type: String },                // type of the metric
  },
  probabilty: { type: Number },            // chance [0, 1] that this reward in an action or process task can be given
  verb: { type: String, enum: [            // operation is performed for this reward
    'add', 'remove', 'set'
  ]},
  value: { type: String },                 // value by which the player's score changes
  recur: { type: Boolean },                // apply the reward on every loop of the looped task
  resolution: { type: String },            // delay the rewards until the resolution task
};

export default { reward }
