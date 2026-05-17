import { CardLocation } from '@dominion/common';

import { OwnedUnorderedCardCollection } from '../card/OwnedUnorderedCardCollection';
import { PrivacyType } from '../card/PrivacyType';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from './Player';

export class IslandMat extends OwnedUnorderedCardCollection {
  constructor(owner: Player, gameMessageBroadcaster: GameMessageBroadcaster) {
    super(owner, CardLocation.ISLAND_MAT, gameMessageBroadcaster, PrivacyType.ALL_VISIBLE);
  }
}
