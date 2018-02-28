import fp from 'mostly-func';

export const evalFormulaValue = (value, variables = []) => {
  // TODO evaluate value formula
  return parseInt(value);
};

const fulfillMetric = (scores, variables, cond) => {
  return true;
};

const fulfillAction = (scores, variables, cond) => {
  return true;
};

const fulfillTeam = (scores, variables, cond) => {
  return true;
};

const fulfillTime = (scores, variables, cond) => {
  return true;
};

const fulfillFormula = (scores, variables, cond) => {
  return true;
};

export const fulfillRequires = fp.curry((scores, variables, cond) => {
  if (cond && cond.rule) {
    switch (cond.rule) {
      case 'metric': return fulfillMetric(scores, variables, cond);
      case 'action': return fulfillAction(scores, variables, cond);
      case 'team': return fulfillTeam(scores, variables, cond);
      case 'time': return fulfillTime(scores, variables, cond);
      case 'formula': return fulfillFormula(scores, variables, cond);
      case 'and': return cond.conditions && fp.all(fulfillRequires(scores, variables), cond.conditions);
      case 'or': return cond.conditions && fp.any(fulfillRequires(scores, variables), cond.conditions);
      default: console.warn('fulfillRequires condition rule not supported', cond.rule);
    }
  }
  return true;
});

export const fulfillAchievementRewards = (achievement, variables = [], scores = []) => {
  return fp.reduce((arr, rule) => {
    if (rule.item && rule.item.name && rule.item.number) {
      if (fulfillRequires(scores, variables, rule.requires)) {
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

export const fulfillLevelRewards = (level, variables = [], scores = []) => {
  const currentState = fp.find(fp.propEq('metric', level.state.id), scores);
  const currentPoint = fp.find(fp.propEq('metric', level.point.id), scores);
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

export const fulfillCustomRewards = (rules, variables = [], scores = []) => {
  // filter by the rule requirements
  const activeRules = fp.filter(rule => {
    return fp.all(fulfillRequires(scores, variables), rule.requires);
  }, rules);
  return fp.flatten(fp.map(fp.prop('rewards'), activeRules));
};