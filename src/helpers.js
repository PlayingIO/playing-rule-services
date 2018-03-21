import assert from 'assert';
import dateFn from 'date-fns';
import fp from 'mostly-func';
import { helpers } from 'mostly-feathers-mongoose';
import nerdamer from 'nerdamer';

export const getMetricRules = (conditions) => {
  return fp.flatten(fp.reduce((arr, cond) => {
    if (cond.rule === 'metric') arr = arr.concat(cond);
    if (cond.rule === 'and' || cond.rule === 'or') {
      arr = arr.concat(fp.flatten(getMetricRules(cond.conditions || [])));
    }
    return arr;
  }, [], conditions));
};

export const operator = (op, lhs, rhs) => {
  switch (op) {
    case 'eq': return lhs === rhs;
    case 'ne': return lhs !== rhs;
    case 'gt': return lhs > rhs;
    case 'gte': return lhs >= rhs;
    case 'lt': return lhs < rhs;
    case 'lte': return lhs <= rhs;
    default:
      console.warn(`operator not supported: '${op}'`);
      return false;
  }
};

export const getAllVariables = (variables = {}, defaults) => {
  const values = fp.reduce((obj, v) => {
    switch (v.type) {
      case 'Number': obj[v.name] = v.default; break;
      case 'String': obj[v.name] = parseInt(v.default); break;
    }
    return obj;
  }, {}, defaults);
  return fp.merge(variables, values);
};

export const evalFormulaValue = (value, variables = {}) => {
  const result = nerdamer(value, variables).evaluate();
  return parseInt(result.text());
};

const fulfillMetric = (user, variables, cond) => {
  if (cond && cond.type && cond.metric) {
    const userMetric = fp.find(fp.propEq('metric', helpers.getId(cond.metric)), user.scores || []);
    switch (cond.type) {
      case 'point':
      case 'set':
      case 'compound': {
        const userValue = (cond.type === 'set')
          ? userMetric && userMetric.value[cond.item] || 0
          : userMetric && userMetric.value || 0;
        const condValue = evalFormulaValue(cond.value, variables);
        return operator(cond.operator, userValue, condValue);
      }
      case 'state': {
        const userValue = userMetric? userMetric.value : null;
        const condValue = cond.value;
        if (cond.operator === 'eq' ||  cond.operator === 'ne') {
          return operator(cond.operator, userValue, condValue);
        } else {
          console.warn('fulfill state metric operator not supported', cond.operator);
          return false;
        }
      }
    }
  }
  return false;
};

const fulfillAction = (user, variables, cond) => {
  if (cond && cond.action) {
    const userAction = fp.find(fp.propEq('action', helpers.getId(cond.action)), user.actions || []);
    const userValue = userAction && userAction.count || 0;
    const condValue = evalFormulaValue(cond.value, variables);
    return operator(cond.operator, userValue, condValue);
  }
  return false;
};

const fulfillTeam = (user, variables, cond) => {
  if (user.groups && cond && cond.team && cond.role) {
    return fp.any(group => {
      return group.team === cond.team
        && fp.contains(cond.role, group.roles || []);
    });
  }
  return false;
};

const fulfillTime = (user, variables, cond) => {
  if (cond && cond.unit) {
    const condValue = evalFormulaValue(cond.value, variables);
    const now = new Date();
    switch (cond.unit) {
      case 'hour_of_day': return operator(cond.operator, dateFn.getHours(now), condValue);
      case 'day_of_week': return operator(cond.operator, dateFn.getISODay(now), condValue);
      case 'day_of_month': return operator(cond.operator, dateFn.getDate(now), condValue);
      case 'day_of_year': return operator(cond.operator, dateFn.getDayOfYear(now), condValue);
      case 'week_of_year': return operator(cond.operator, dateFn.getISOWeek(now), condValue);
      case 'month_of_year': return operator(cond.operator, dateFn.getMonth(now), condValue);
    }
  }
  return false;
};

const fulfillFormula = (user, variables, cond) => {
  if (cond && cond.lhs !== undefined && cond.rhs !== undefined) {
    const lhs = evalFormulaValue(cond.lhs, variables);
    const rhs = evalFormulaValue(cond.rhs, variables);
    return operator(cond.operator, lhs, rhs);
  }
  return false;
};

export const fulfillRequire = fp.curry((user, variables, cond) => {
  if (cond && cond.rule) {
    switch (cond.rule) {
      case 'metric': return fulfillMetric(user, variables, cond);
      case 'action': return fulfillAction(user, variables, cond);
      case 'team': return fulfillTeam(user, variables, cond);
      case 'time': return fulfillTime(user, variables, cond);
      case 'formula': return fulfillFormula(user, variables, cond);
      case 'and': return cond.conditions && fp.all(fulfillRequire(user, variables), cond.conditions);
      case 'or': return cond.conditions && fp.any(fulfillRequire(user, variables), cond.conditions);
      default: console.warn('fulfillRequire condition rule not supported', cond.rule);
    }
  }
  return true;
});

export const fulfillRequires = fp.curry((user, variables, requires) => {
  return requires && fp.all(fulfillRequire(user, variables), requires);
});

export const fulfillAchievementRewards = (achievement, variables, user) => {
  return fp.reduce((arr, rule) => {
    if (rule.item && rule.item.name && rule.item.number) {
      if (fulfillRequire(user, variables, rule.requires)) {
        const reward = {
          metric: achievement.metric,
          item: rule.item.name,
          verb: 'add',
          value: rule.item.number
        };
        return fp.concat(arr, [reward]);
      }
    } else {
      console.warn('process achievement rule skipped:', rule);
    }
    return arr;
  }, [], achievement.rules || []);
};

export const fulfillLevelRewards = (level, user) => {
  const currentState = fp.find(fp.propEq('metric', level.state.id), user.scores || []);
  const currentPoint = fp.find(fp.propEq('metric', level.point.id), user.scores || []);
  if (level.levels && currentPoint && currentPoint.value > 0) {
    for (let i = 0; i < level.levels.length; i++) {
      if (currentPoint.value < level.levels[i].threshold) {
        const reward = {
          metric: level.state,
          verb: 'set',
          value: level.levels[i].rank
        };
        return [reward];
      }
    }
  }
  return [];
};

export const fulfillCustomRewards = (rules, variables, user) => {
  // filter by the rule requirements
  const activeRules = fp.filter(rule => {
    return fp.all(fulfillRequire(user, variables), rule.requires);
  }, rules);
  return fp.flatMap(fp.prop('rewards'), activeRules);
};

export const addInterval = (startTime, unit) => {
  switch (unit) {
    case 'minute': return dateFn.addMinutes(startTime, 1);
    case 'hour': return dateFn.addHours(startTime, 1);
    case 'day': return dateFn.addDays(startTime, 1);
    case 'week': return dateFn.addWeeks(startTime, 1);
    case 'month': return dateFn.addMonths(startTime, 1);
    case 'year': return dateFn.addISOYears(startTime, 1);
    default: return startTime;
  }
};

export const processUserRules = (app) => {
  const svcUserRules = app.service('user-rules');
  return async (user) => {
    return svcUserRules.create({ user: user.id }, { user });
  };
};