import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Amulet extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Amulet'));
  }

  private async doAmuletChoice(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+ $1', async () => {
          await ie.addCoins(1);
        }),
      )
      .from(
        new ActionChoice('Trash a card from your hand', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Trash a card from your hand')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .allowNoneOption()
            .choose();
          if (card instanceof Card) {
            await ie.trashCardFromLocation(card, CardLocation.HAND);
          }
        }),
      )
      .from(
        new ActionChoice('Gain a Silver', async () => {
          await ie.gainCardFromPile('Silver');
        }),
      )
      .choose();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await this.doAmuletChoice(ie);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await this.doAmuletChoice(ie);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
