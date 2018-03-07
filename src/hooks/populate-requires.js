import assert from 'assert';
import fp from 'mostly-func';
import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';
import { getMetricRules } from '../helpers';

const debug = makeDebug('playing:rule-services:hooks:populateRequires');

const getRequiresField = (target) => fp.reduce((arr, item) => {
  arr.push(helpers.getField(item, target) || []);
  return arr;
}, []);

export default function populateRequires(target, getRequires) {
  return (hook) => {
    assert(hook.type === 'after', `populateRequires must be used as a 'after' hook.`);

    let params = fp.assign({ query: {} }, hook.params);
    let data = helpers.getHookDataAsArray(hook);

    // target must be specified by $select to assoc
    if (!helpers.isSelected(target, params.query.$select)) return hook;

    // gether all requires in rules, as array of conditions array
    const getRequiresFunc = getRequires || getRequiresField(target);
    const requires = fp.reject(fp.isEmpty, getRequiresFunc(data));
    const metricRules = fp.flatten(fp.map(getMetricRules, requires));
    return helpers.populateByService(hook.app, 'metric', 'type')(metricRules).then(results => {
      return hook;
    });
  };
}