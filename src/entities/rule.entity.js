import Entity from 'mostly-entity';
import { BlobEntity } from 'playing-content-common';

const RuleEntity = new Entity('Rule', {
  image: { using: BlobEntity }
});

RuleEntity.excepts('_id');

export default RuleEntity.asImmutable();
