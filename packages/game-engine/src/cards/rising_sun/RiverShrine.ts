import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, TurnPhase } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class RiverShrine extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('River Shrine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    const trashedCards = await ie
      .chooseCards('Trash up to 2 cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(2))
      .choose();
    await ie.trashCardsFromLocation(trashedCards, CardLocation.HAND);

    let gainedCardInBuyPhase = false;
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(
          new EffectAction((effectIe: InstructionExecutor) => {
            if (effectIe.getSharedGameState().getTurnPhase() === TurnPhase.BUY) {
              gainedCardInBuyPhase = true;
            }
          }),
        )
        .build(),
    );

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .addCondition(new EffectCondition(() => !gainedCardInBuyPhase))
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const cardToGain = await effectIe
              .chooseCard('Choose a card to gain')
              .from(CardSelectionLocation.SUPPLY)
              .to(CardSelectionPurpose.GAIN)
              .whereCardIs(costsUpTo(Cost.Simple(4)))
              .allowNoneOption()
              .choose();
            if (cardToGain instanceof Card) {
              await effectIe.gainCardFromPile(cardToGain);
            }
          }),
        )
        .build(),
    );
  }
}
