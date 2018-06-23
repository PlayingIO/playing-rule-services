import Entity from 'mostly-entity';
import { BlobEntity } from 'playing-content-common';

const RuleEntity = new Entity('Rule', {
  image: { using: BlobEntity }
});

RuleEntity.discard('_id');

export default RuleEntity.freeze();
