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
    'ROLLING',                             // replenished continuously as the window keeps moving ahead
    'FIXED',                               // replenished only at the start of the next window
    'LEAKY'                                // replenished at constant intervals when exhausted
  ]},
};

const limit = {
  count: { type: Number },                 // count-down number of times the player can perform within the window
  firstRequest: { type: Date },            // first request time within the window
  lastRequest: { type: Date },             // last request time within the window
  expiredAt: { type: Date }                // expire time of the window
};

export { rate, limit };