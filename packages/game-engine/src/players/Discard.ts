import { CardLocation } from '@dominion/common';

import { OwnedOrderedStack } from '../card/OwnedOrderedStack';
import { PrivacyType } from '../card/PrivacyType';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from './Player';

export class Discard extends OwnedOrderedStack {
  constructor(owner: Player, gameMessageBroadcaster: GameMessageBroadcaster) {
    super(owner, CardLocation.DISCARD, gameMessageBroadcaster, PrivacyType.TOP_CARD_VISIBLE_TO_ALL);
  }
}
