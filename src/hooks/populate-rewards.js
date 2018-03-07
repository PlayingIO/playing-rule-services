import assert from 'assert';
import fp from 'mostly-func';
import makeDebug from 'debug';
import { helpers } from 'mostly-feathers-mongoose';

const debug = makeDebug('playing:rule-services:hooks:populateRewards');

const getRewardsField = (target) => fp.reduce((arr, item) => {
  return arr.concat(helpers.getField(item, target));
}, []);

export default function populateRewards(target, getRewards) {
  getRewards = getRewards || getRewardsField(target);

  return (hook) => {
    assert(hook.type === 'after', `populateRewards must be used as a 'after' hook.`);

    let params = fp.assign({ query: {} }, hook.params);
    let data = helpers.getHookDataAsArray(hook);

    // target must be specified by $select to assoc
    if (!helpers.isSelected(target, params.query.$select)) return hook;

    // gether all rewards
    const metricRewards = getRewards(data);
    return helpers.populateByService(hook.app, 'metric', 'type')(metricRewards).then(results => {
      return hook;
    });
  };
}