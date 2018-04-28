import { camelCase } from 'mostly-func';
import glob from 'glob';
import path from 'path';
import { rate, limit } from './rate.schema';
import { requires } from './requires.schema';
import { reward } from './reward.schema';
import { variable } from './variable.schema';

// load all models
const modelFiles = glob.sync(path.join(__dirname, './*.model.js'));
export default Object.assign({
  rate: { schema: rate },
  limit: { schema: limit },
  requires: { schema: requires },
  rewards: { schema: [reward] },
  variables: { schema: [variable] }
}, ...modelFiles.map(file => {
  const name = camelCase(path.basename(file, '.model.js'));
  return { [name]: require(file).default };
}));

