import { CardLocation } from '@dominion/common';

import { PrivacyType } from './card/PrivacyType';
import { SharedUnorderedCardCollection } from './card/SharedUnorderedCardCollection';
import { GameMessageBroadcaster } from './messaging/GameMessageBroadcaster';

export class Trash extends SharedUnorderedCardCollection {
  constructor(gameMessageBroadcaster: GameMessageBroadcaster) {
    super(CardLocation.TRASH, gameMessageBroadcaster, PrivacyType.ALL_VISIBLE);
  }
}
