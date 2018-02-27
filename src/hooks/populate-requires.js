import assert from 'assert';
import fp from 'mostly-func';
import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';

const debug = makeDebug('playing:rule-services:hooks:populateRequires');

function getMetricRules(conditions) {
  return fp.flatten(fp.reduce((arr, cond) => {
    if (cond.rule === 'metric') arr = arr.concat(cond);
    if (cond.rule === 'and' || cond.rule === 'or') {
      arr = arr.concat(fp.flatten(getMetricRules(cond.conditions || [])));
    }
    return arr;
  }, [], conditions));
}

export default function populateRequires(options = {}) {
  return (hook) => {
    assert(hook.type === 'after', `documentEnrichers must be used as a 'after' hook.`);

    let results = [].concat(hook.result && hook.result.data || hook.result || []);
    const requires = fp.reduce((arr, rule) => {
      if (rule.type === 'achievement') {
        return arr.concat(fp.map(fp.prop('requires'), rule.achievement.rules || []));
      } else if (rule.type === 'custom') {
        return arr.concat(fp.map(fp.prop('requires'), rule.custom.rules || []));
      }
      return arr;
    }, [], results);
    const metricRules = fp.flatten(fp.map(getMetricRules, requires));
    return helpers.populateByService(hook.app, 'metric', 'type')(metricRules).then(results => {
      return hook;
    });
  };
}