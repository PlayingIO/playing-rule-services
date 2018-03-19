import assert from 'assert';
import fp from 'mostly-func';
import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';

const debug = makeDebug('playing:rule-services:hooks:populateRewards');

const getRewardsField = (target) => fp.reduce((arr, item) => {
  return arr.concat(helpers.getField(item, target));
}, []);

export default function populateRewards(target, getRewards) {
  return async function (context) {
    assert(context.type === 'after', `populateRewards must be used as a 'after' hook.`);

    let params = fp.assign({ query: {} }, context.params);
    let data = helpers.getHookDataAsArray(context);

    // target must be specified by $select to assoc
    if (!helpers.isSelected(target, params.query.$select)) return context;

    // gether all rewards
    const getRewardsFunc = getRewards || getRewardsField(target);
    const metricRewards = fp.reject(fp.isNil, getRewardsFunc(data));
    await helpers.populateByService(context.app, 'metric', 'type')(metricRewards);

    return context;
  };
}