import { CardLocation } from '@dominion/common';

import { OwnedUnorderedCardCollection } from '../card/OwnedUnorderedCardCollection';
import { PrivacyType } from '../card/PrivacyType';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from './Player';

// TODO: add stacks here, so that we can have multiple sets of revealed cards
export class Limbo extends OwnedUnorderedCardCollection {
  constructor(owner: Player, gameMessageBroadcaster: GameMessageBroadcaster) {
    super(owner, CardLocation.SET_ASIDE, gameMessageBroadcaster, PrivacyType.SIZE_VISIBLE_TO_OPPONENTS);
  }
}
