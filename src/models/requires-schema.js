import fp from 'mostly-func';

// metric based condition
const metricCondition = {
  id: { type: 'String' },                    // id of metric
  item: { type: 'String' },                  // set item to be compared
  operator: { type: 'String', enum: [        // relational operator
    'eq', 'ne', 'gt', 'ge', 'lt', 'le'
  ]},
  value: { type: 'String' },                 // value of the metric/time
};

// action based condition
const actionCondition = {
  id: { type: 'String' },                    // id of action
  operator: { type: 'String', enum: [        // relational operator
    'eq', 'ne', 'gt', 'ge', 'lt', 'le'
  ]},
  value: { type: 'String' },                 // number of times the action should be executed by the player
};

// team based condition
const teamCondition = {
  id: { type: 'String' },                    // definition id of team,
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
  type: { type: 'String' },                  // condition type and/or
  conditions: [{ type: 'Mixed' }],           // array of conditions joined with an AND or OR operator
  condition: { type: 'Mixed' }
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
const requires = {
  type: { type: 'String', enum: [            // type of condition
    'metric', 'action', 'team', 'and', 'or'
  ]},
  not: { type: 'Boolean', default: false },  // whether invert the condition
  conditions: [condition],                   // array of conditions
  condition: condition
};

export default { condition, requires }
