import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Feodum extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Feodum'));
    // When you trash this, gain 3 Silvers
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TRASH)
        .self()
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            await ie.gainFromPile('silver');
            await ie.gainFromPile('silver');
            await ie.gainFromPile('silver');
          }),
        )
        .build(),
    );
  }

  public score(allCardGroups: CardCollection[]): number {
    let numSilvers = 0;
    for (const cardGroup of allCardGroups) {
      numSilvers += cardGroup.numMatchingCards(cardNameIs('Silver'));
    }
    return Math.floor(numSilvers / 3);
  }
}
