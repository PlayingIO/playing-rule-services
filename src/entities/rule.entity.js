const Entity = require('mostly-entity');
const { BlobEntity } = require('playing-content-common');

const RuleEntity = new Entity('Rule', {
  image: { using: BlobEntity }
});

RuleEntity.discard('_id');

module.exports = RuleEntity.freeze();
