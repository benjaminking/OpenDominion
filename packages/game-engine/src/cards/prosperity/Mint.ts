import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, isDurationCard, isTheSameCardAs, isTreasureCard, not } from '../../StandardCardEligibilityFunctions';

export class Mint extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mint'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .addCondition(new EffectCondition(() => this.getLocation() !== CardLocation.PILE))
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const treasuresInPlay = ie.getMatchingCardsInPlay(both(isTreasureCard, not(isDurationCard)));
            await ie.trashCardsFromLocation(treasuresInPlay, CardLocation.IN_PLAY);
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const revealedTreasure: Card | Choice = await ie
      .chooseCard('You may reveal a Treasure card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();

    if (revealedTreasure instanceof Card) {
      await ie.revealCard(revealedTreasure);
      await ie.gainCardFromPile(revealedTreasure);
    }
  }
}
