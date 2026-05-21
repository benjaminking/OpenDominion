import { CardLocation } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from '../players/Player';
import { OrderedStack } from './OrderedStack';
import { PrivacyType } from './PrivacyType';

export class OwnedOrderedStack extends OrderedStack {
  constructor(
    private readonly owner: Player,
    location: CardLocation,
    gameMessageBroadcaster: GameMessageBroadcaster,
    private readonly privacyType: PrivacyType,
  ) {
    super(location, gameMessageBroadcaster);
  }

  protected broadcastValue(): void {
    this.gameMessageBroadcaster.updatePlayerCards(this.owner, this.location, this.privacyType, this);
  }
}
