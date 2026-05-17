import { CardLocation } from '@dominion/common';

import { OwnedUnorderedCardCollection } from '../card/OwnedUnorderedCardCollection';
import { PrivacyType } from '../card/PrivacyType';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from './Player';

export class Hand extends OwnedUnorderedCardCollection {
  constructor(owner: Player, gameMessageBroadcaster: GameMessageBroadcaster) {
    super(owner, CardLocation.HAND, gameMessageBroadcaster, PrivacyType.SIZE_VISIBLE_TO_OPPONENTS);
  }
}
