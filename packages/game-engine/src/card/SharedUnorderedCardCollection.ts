import { CardLocation } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { PrivacyType } from './PrivacyType';
import { UnorderedCardCollection } from './UnorderedCardCollection';

export class SharedUnorderedCardCollection extends UnorderedCardCollection {
  constructor(
    protected readonly location: CardLocation,
    protected readonly gameMessageBroadcaster: GameMessageBroadcaster,
    protected readonly privacyType: PrivacyType,
  ) {
    super(location, gameMessageBroadcaster);
  }

  protected broadcastValue(): void {
    this.gameMessageBroadcaster.updateSharedCards(this.location, this.privacyType, this);
  }
}
