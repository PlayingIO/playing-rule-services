// rate structure
const rate = {
  count: { type: Number },                 // number of times the player can perform this action within the window
  frequency: { type: Number },             // frequency of the inverval
  interval: { type: String , enum: [       // interval unit of the window
    'minute', 'hour', 'day', 'week', 'month', 'year'
  ]},
  window: { type: String, enum: [          // window of rate limiting being used
    'rolling',                             // rolling window rate limit
    'fixed',                               // fixed window rate limit
    'leaky'                                // leaky bucket algorithm
  ]},
};

export default { rate };