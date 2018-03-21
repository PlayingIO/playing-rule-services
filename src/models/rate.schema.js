/**
 * rate limiting
 */
const rate = {
  count: { type: Number },                 // number of times the player can perform within the window
  frequency: { type: Number },             // frequency of the inverval
  interval: { type: String , enum: [       // interval unit of the window
    'minute', 'hour', 'day', 'week', 'month', 'year'
  ]},
  window: { type: String, enum: [          // window of rate limiting being used
    'rolling',                             // replenished continuously as the window keeps moving ahead
    'fixed',                               // replenished only at the start of the next window
    'leaky'                                // replenished at constant intervals when exhausted
  ]},
};

const limit = {
  count: { type: Number },
  lastRequest: { type: Date },
  firstRequest: { type: Date },
  expiredAt: { type: Date }
};

export default { rate, limit };