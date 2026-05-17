import { CardLocation } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from '../players/Player';
import { PrivacyType } from './PrivacyType';
import { UnorderedCardCollection } from './UnorderedCardCollection';

export class OwnedUnorderedCardCollection extends UnorderedCardCollection {
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
