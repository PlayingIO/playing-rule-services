import Entity from 'mostly-entity';
import { entities as contents } from 'playing-content-services';

const RuleEntity = new Entity('Rule', {
  image: { using: contents.BlobEntity }
});

RuleEntity.excepts('updatedAt', 'destroyedAt');

export default RuleEntity.asImmutable();
