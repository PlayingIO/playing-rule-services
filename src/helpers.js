import fp from 'mostly-func';

export const fulfillRequires = (cond) => {
  return true;
};

export const fulfillRewards = (rules) => {
  // filter by the rule requirements
  const activeRules = fp.filter(rule => {
    return fp.all(fulfillRequires, rule.requires);
  }, rules);
  return fp.flatten(fp.map(fp.prop('rewards'), activeRules));
};