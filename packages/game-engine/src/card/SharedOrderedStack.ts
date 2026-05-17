import { CardLocation } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Card } from './Card';
import { CardCollection } from './CardCollection';
import { OrderedStack } from './OrderedStack';
import { PrivacyType } from './PrivacyType';

export class SharedOrderedStack extends OrderedStack {
  constructor(
    protected readonly location: CardLocation,
    protected readonly gameMessageBroadcaster: GameMessageBroadcaster,
    protected readonly privacyType: PrivacyType,
    cardCollection?: Card | CardCollection,
  ) {
    super(location, gameMessageBroadcaster, cardCollection);
  }

  protected broadcastValue(): void {
    this.gameMessageBroadcaster.updateSharedCards(this.location, this.privacyType, this);
  }
}
