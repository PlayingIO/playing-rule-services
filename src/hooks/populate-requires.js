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
  return async function (context) {
    assert(context.type === 'after', `populateRequires must be used as a 'after' hook.`);

    let params = fp.assign({ query: {} }, context.params);
    let data = helpers.getHookDataAsArray(context);

    // target must be specified by $select to populate
    if (!helpers.isSelected(target, params.query.$select)) return context;

    // gether all requires in rules, as array of conditions array
    const getRequiresFunc = getRequires || getRequiresField(target);
    const requires = fp.reject(fp.isEmpty, getRequiresFunc(data));
    const metricRules = fp.flatten(fp.map(getMetricRules, requires));
    await helpers.populateByService(context.app, 'metric', 'type')(metricRules);

    return context;
  };
}