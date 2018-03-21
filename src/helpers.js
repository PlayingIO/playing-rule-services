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

export const checkRateLimit = (rate, limit) => {
  const now = new Date();
  let { count, lastRequest, firstRequest, expiredAt } = limit || {};
  if (expiredAt && expiredAt.getTime() >= now.getTime()) {
    // replenish the count for leady bucket
    if (rate.window === 'leaky') {
      count += Math.floor(differenceInterval(lastRequest, now) / rate.frequency * count);
      count = Math.min(count, rate.count);
    }
  }

  // reset the limit
  if (!expiredAt || expiredAt.getTime() < now.getTime()) {
    count = rate.count;
    switch (rate.window) {
      case 'fixed':
        firstRequest = startOfInterval(now, rate.frequency, rate.interval);
        break;
      case 'rolling':
        firstRequest = now;
        break;
      case 'leaky':
        firstRequest = now;
        break;
    }
    expiredAt = addInterval(firstRequest, rate.frequency, rate.interval);
  }

  if (expiredAt.getTime() >= now.getTime() && count > 0) {
    count = count - 1;
    lastRequest = now;
  } else {
    throw new Error('Rate limit exceed, the action can only be triggered ' +
      `${rate.count} times every ${rate.frequency} ${rate.interval}s`);
  }

  return { count, lastRequest, firstRequest, expiredAt };
};

export const startOfInterval = (date, frequency, unit) => {
  switch (unit) {
    case 'minute': {
      const minute = dateFn.getMinutes(date);
      return dateFn.startOfMinute(dateFn.setMinutes(date, minute - minute % frequency));
    }
    case 'hour': {
      const hour = dateFn.getHours(date);
      return dateFn.startOfHour(dateFn.setHours(date, hour - hour % frequency));
    }
    case 'day': {
      const day = dateFn.getDayOfYear(date);
      return dateFn.startOfDay(dateFn.setDayOfYear(date, day - day % frequency));
    }
    case 'week': {
      const week = dateFn.getISOWeek(date);
      return dateFn.startOfISOWeek(dateFn.setISOWeek(date, week - week % frequency));
    }
    case 'month': {
      const month = dateFn.getMonth(date);
      return dateFn.startOfMonth(dateFn.setMonth(date, month - month % frequency));
    }
    case 'year': {
      const year = dateFn.getYear(date);
      return dateFn.startOfYear(dateFn.setYear(date, year - year % frequency));
    }
    default: return date;
  }
};

export const addInterval = (startTime, frequency, unit) => {
  switch (unit) {
    case 'minute': return dateFn.addMinutes(startTime, frequency);
    case 'hour': return dateFn.addHours(startTime, frequency);
    case 'day': return dateFn.addDays(startTime, frequency);
    case 'week': return dateFn.addWeeks(startTime, frequency);
    case 'month': return dateFn.addMonths(startTime, frequency);
    case 'year': return dateFn.addISOYears(startTime, frequency);
    default: return startTime;
  }
};

export const differenceInterval = (startTime, endTime, unit) => {
  switch (unit) {
    case 'minute': return dateFn.differenceInMinutes(endTime, startTime);
    case 'hour': return dateFn.differenceInHours(endTime, startTime);
    case 'day': return dateFn.differenceInDays(endTime, startTime);
    case 'week': return dateFn.differenceInWeeks(endTime, startTime);
    case 'month': return dateFn.differenceInMonths(endTime, startTime);
    case 'year': return dateFn.differenceInYears(endTime, startTime);
    default: return 0;
  }
};

export const processUserRules = (app) => {
  const svcUserRules = app.service('user-rules');
  return async (user) => {
    return svcUserRules.create({ user: user.id }, { user });
  };
};