import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { RestOfTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Haggler extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Haggler'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.BUY, EffectSource.SELF)
        .withExpiration(new RestOfTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .makeMandatory()
        .action(new EffectAction(this.onBuy.bind(this)))
        .build(),
    );
  }

  private async onBuy(ie: InstructionExecutor, boughtCard: Card): Promise<void> {
    const cheaperNonVictory = new CardEligibilityFunction(
      (card: Card) => card.getCost().isLessThan(boughtCard.getCost()) && !isVictoryCard.matches(card),
    );

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a cheaper non-Victory card to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(cheaperNonVictory)
      .allowNoneOption()
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
