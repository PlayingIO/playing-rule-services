// reward structure
const reward = {
  _id: false,
  metric: { type: 'ObjectId' },               // the metric which will be used for the reward
  type: { type: String },                     // type of the metric
  verb: { type: String, enum: [               // operation is performed for this reward
    'add', 'remove', 'set'
  ]},
  item: { type: String },                     // name of the set metric
  chance: { type: Number, default: 100 },     // chance [0, 100] that this reward in an action or process task can be given
  value: { type: String },                    // value by which the player's score changes
  recur: { type: Boolean },                   // whether apply the reward on every loop of the looped task
                                              //   or only after all it's loops are complete
  resolution: { type: String },               // delay the rewards until the resolution task
};

export { reward };
