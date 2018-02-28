import fp from 'mostly-func';

const fulfillMetric = (scores, cond) => {
  return true;
};

const fulfillAction = (scores, cond) => {
  return true;
};

const fulfillTeam = (scores, cond) => {
  return true;
};

const fulfillTime = (scores, cond) => {
  return true;
};

const fulfillFormula = (scores, cond) => {
  return true;
};

export const fulfillRequires = fp.curry((scores, conditions) => {
  if (!conditions) return true; // requires no conditions
  return fp.all(cond => {
    if (!cond) return true;
    switch (cond.rule) {
      case 'metric': return fulfillMetric(scores, cond);
      case 'action': return fulfillAction(scores, cond);
      case 'team': return fulfillTeam(scores, cond);
      case 'time': return fulfillTime(scores, cond);
      case 'formula': return fulfillFormula(scores, cond);
      case 'and': return cond.conditions && fp.all(fulfillRequires(scores, cond.conditions));
      case 'or': return cond.conditions && fp.any(fulfillRequires(scores, cond.conditions));
      default:
        console.warn('fulfillRequires condition rule not supported', cond.rule);
        return true;
    }
  }, conditions);
});

export const fulfillAchievementRewards = (achievement, scores = []) => {
  return fp.reduce((arr, rule) => {
    if (rule.item && rule.item.name && rule.item.number) {
      if (fulfillRequires(rule.requires)) {
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

export const fulfillLevelRewards = (level, scores = []) => {
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

export const fulfillCustomRewards = (rules, scores = []) => {
  // filter by the rule requirements
  const activeRules = fp.filter(rule => {
    return fp.all(fulfillRequires(scores, rule.requires));
  }, rules);
  return fp.flatten(fp.map(fp.prop('rewards'), activeRules));
};