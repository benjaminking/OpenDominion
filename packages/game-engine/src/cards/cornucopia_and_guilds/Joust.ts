import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

const isProvince = new CardEligibilityFunction((c: Card) => c.getName() === 'Province');

// Joust: +1 Card, +1 Action, +$1. You may set aside a Province from your hand;
// if you do, gain a Reward card.
// Note: gainReward() is a stub — Reward cards are not yet implemented.
export class Joust extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Joust'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);

    // You may set aside a Province from your hand
    const province: Card | Choice = await ie
      .chooseCard('You may set aside a Province from your hand to gain a Reward')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isProvince)
      .allowNoneOption()
      .choose();

    if (province instanceof Card) {
      await ie.setCardAsideFromLocation(province, CardLocation.HAND);
      // TODO: gainReward stub - gains a card from the Reward pile
      await ie.gainReward();
      // Province discards in cleanup (handled by canBeDiscardedInCleanup for SET_ASIDE)
    }
  }
}
