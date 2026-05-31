import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Raid extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Raid'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain a Silver per Silver you have in play
    const silversInPlay = ie.numMatchingCardsPlayedThisTurn(cardNameIs('Silver'));
    for (let i = 0; i < silversInPlay; i++) {
      await ie.gainCardFromPile('Silver');
    }
    // Each other player puts their -1 Card token on their deck
    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      const otherPlayer = otherIe.getSharedGameState().getCurrentPlayer();
      otherIe.giveMinusOneCardToken(otherPlayer);
    });
  }
}
