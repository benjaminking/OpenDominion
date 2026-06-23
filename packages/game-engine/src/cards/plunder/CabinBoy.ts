import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isDurationCard } from '../../StandardCardEligibilityFunctions';

export class CabinBoy extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cabin Boy'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            await effectIe
              .chooseOneOption('Choose one')
              .from(
                new ActionChoice('+$2', async () => {
                  await effectIe.addCoins(2);
                }),
              )
              .from(
                new ActionChoice('Trash this to gain a Duration card', async () => {
                  const trashedCard = await effectIe.trashCardFromLocation(this, CardLocation.IN_PLAY);
                  if (!(trashedCard instanceof Card)) {
                    return;
                  }

                  const cardToGain: Card | Choice = await effectIe
                    .chooseCard('Choose a Duration card to gain')
                    .from(CardSelectionLocation.SUPPLY)
                    .to(CardSelectionPurpose.GAIN)
                    .whereCardIs(isDurationCard)
                    .choose();
                  if (cardToGain instanceof Card) {
                    await effectIe.gainCardFromPile(cardToGain);
                  }
                }),
              )
              .choose();
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
