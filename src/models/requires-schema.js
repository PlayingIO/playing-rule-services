import fp from 'mostly-func';

// metric based condition
const metricCondition = {
  metric: { type: 'String' },                // id of metric
  type: { type: 'String' },                  // type of metric
  item: { type: 'String' },                  // set item to be compared
  operator: { type: 'String', enum: [        // relational operator
    'eq', 'ne', 'gt', 'ge', 'lt', 'le'
  ]},
  value: { type: 'String' },                 // value of the metric
};

// action based condition
const actionCondition = {
  action: { type: 'String' },                // id of action
  operator: { type: 'String', enum: [        // relational operator
    'eq', 'ne', 'gt', 'ge', 'lt', 'le'
  ]},
  value: { type: 'String' },                 // number of times the action should be executed by the player
};

// team based condition
const teamCondition = {
  team: { type: 'String' },                  // definition id of team,
  role: { type: 'String' },                  // role the player should have
};

// timed condition
const timedCondition = {
  time: { type: 'String', enum: [            // time unit to be counted, against a fixed duration
    'hour_of_day',
    'day_of_week',
    'day_of_month',
    'day_of_year',
    'week_of_year',
    'month_of_year'
  ]},
  operator: { type: 'String', enum: [        // relational operator
    'eq', 'ne', 'gt', 'ge', 'lt', 'le'
  ]},
  value: { type: 'String' },                 // count of the unit
};

// formula based condition
const formulaCondition = {
  lhs: { type: 'String' },                   // lhs formula
  operator: { type: 'String', enum: [        // relational operator
    'eq', 'ne', 'gt', 'ge', 'lt', 'le'
  ]},
  rhs: { type: 'String' },                   // rhs formula
};

const andOrCondition = {
  rule: { type: 'String', enum: [            // type of rule
    'metric', 'action', 'team', 'and', 'or'
  ], required: true },
  not: { type: 'Boolean', default: false },  // whether invert the condition
  conditions: [{ type: 'Mixed' }],           // array of conditions joined with an AND or OR operator
};

const condition = fp.mergeAll(
  metricCondition,
  actionCondition,
  teamCondition,
  timedCondition,
  formulaCondition,
  andOrCondition
);

// requires structure
const requires = [condition];

export default { condition, requires }
