import fp from 'mostly-func';

// metric based condition
const metricCondition = {
  metric: { type: String },                // id of metric
  type: { type: String },                  // type of metric
  item: { type: String },                  // set item to be compared
  operator: { type: String, enum: [        // relational operator
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte'
  ]},
  value: { type: String },                 // value of the metric
};

// action based condition
const actionCondition = {
  action: { type: String },                // id of action
  operator: { type: String, enum: [        // relational operator
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte'
  ]},
  value: { type: String },                 // number of times the action should be executed by the player
};

// team based condition
const teamCondition = {
  team: { type: String },                  // definition id of team,
  role: { type: String },                  // role the player should have
};

// timed condition
const timedCondition = {
  unit: { type: String, enum: [            // time unit to be counted, against a fixed duration
    'hour_of_day',
    'day_of_week',
    'day_of_month',
    'day_of_year',
    'week_of_year',
    'month_of_year'
  ]},
  operator: { type: String, enum: [        // relational operator
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte'
  ]},
  value: { type: String },                 // count of the unit
};

// formula based condition
const formulaCondition = {
  lhs: { type: String },                   // lhs formula
  operator: { type: String, enum: [        // relational operator
    'eq', 'ne', 'gt', 'gte', 'lt', 'lte'
  ]},
  rhs: { type: String },                   // rhs formula
};

const andOrCondition = {
  rule: { type: String, enum: [            // type of rule
    'metric', 'action', 'team', 'time', 'formula', 'and', 'or'
  ], required: true },
  not: { type: Boolean },                  // whether invert the condition
  conditions: { type: Array, default: undefined }, // array of conditions joined with an AND or OR operator
};

const condition = fp.mergeAll([
  { _id: false },
  metricCondition,
  actionCondition,
  teamCondition,
  timedCondition,
  formulaCondition,
  andOrCondition
]);

// requires structure
const requires = [condition];

export { condition, requires };
