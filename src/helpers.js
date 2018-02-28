import fp from 'mostly-func';

const fulfillMetric = (cond) => {
  return true;
};

const fulfillAction = (cond) => {
  return true;
};

const fulfillTeam = (cond) => {
  return true;
};

const fulfillTime = (cond) => {
  return true;
};

const fulfillFormula = (cond) => {
  return true;
};

export const fulfillRequires = (conditions) => {
  if (!conditions) return true; // requires no conditions
  return fp.all(cond => {
    if (!cond) return true;
    switch (cond.rule) {
      case 'metric': return fulfillMetric(cond);
      case 'action': return fulfillAction(cond);
      case 'team': return fulfillTeam(cond);
      case 'time': return fulfillTime(cond);
      case 'formula': return fulfillFormula(cond);
      case 'and': return cond.conditions && fp.all(fulfillRequires(cond.conditions));
      case 'or': return cond.conditions && fp.any(fulfillRequires(cond.conditions));
      default:
        console.warn('fulfillRequires condition rule not supported', cond.rule);
        return true;
    }
  }, conditions);
};

export const fulfillAchievementRewards = (achievement) => {
  if (achievement.rules) {
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
    }, [], achievement.rules);
  }
};

export const fulfillCustomRewards = (rules) => {
  // filter by the rule requirements
  const activeRules = fp.filter(rule => {
    return fp.all(fulfillRequires, rule.requires);
  }, rules);
  return fp.flatten(fp.map(fp.prop('rewards'), activeRules));
};