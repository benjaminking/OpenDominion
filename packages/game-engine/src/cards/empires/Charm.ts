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
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsTheSameAs, isVictoryCard } from '../../StandardCardEligibilityFunctions';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';

export class Charm extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Charm'));
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+1 Buy and +$2', async () => {
          ie.addBuys(1);
          await ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice('Next gain: may also gain a differently-named card of the same cost', () => {
          // Add effect: next time you gain a card this turn, you may gain a differently-named card with the same cost
          ie.addEffect(
            new Effect.Builder()
              .from(this)
              .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
              .withExpiration(ie.createOnceThisTurnEffectExpiration())
              .action(
                new EffectAction(async (ie: InstructionExecutor, gainedCard: Card | undefined) => {
                  if (!(gainedCard instanceof Card)) {
                    return;
                  }
                  const differentName = new CardEligibilityFunction(
                    (c: Card) =>
                      costsTheSameAs(gainedCard).matches(c) &&
                      c.getName().toLowerCase() !== gainedCard.getName().toLowerCase(),
                  );
                  const extra: Card | Choice = await ie
                    .chooseCard('Gain a differently-named card costing the same as ' + gainedCard.getName())
                    .from(CardSelectionLocation.SUPPLY)
                    .to(CardSelectionPurpose.GAIN)
                    .whereCardIs(differentName)
                    .allowNoneOption()
                    .choose();
                  if (extra instanceof Card) {
                    await ie.gainCardFromPile(extra);
                  }
                }),
              )
              .build(),
          );
        }),
      )
      .choose();
  }
}
