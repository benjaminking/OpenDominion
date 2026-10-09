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
import { Pile } from '../../piles/Pile';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { AddedPilePostAction } from '../../setup/AddedPilePostAction';
import { PileAddingSetupRule } from '../../setup/PileAddingSetupRule';
import { PileSpecification } from '../../setup/PileSpecification';
import { isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

// Setup runs on a single Ferryman (the randomizer), but every Ferryman in the game
// needs to know which pile was added, so the pile name is recorded per game.
const addedPileNames = new WeakMap<SharedGameState, string>();

export class Ferryman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ferryman'));
    this.addSetupRule(
      new PileAddingSetupRule(
        new PileSpecification({ requiredCoinCosts: [3, 4] }),
        new AddedPilePostAction((pile: Pile) => {
          addedPileNames.set(sharedGameState, pile.name);
        }),
      ),
    );
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(new EffectCondition(() => addedPileNames.has(sharedGameState)))
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const addedPileName = addedPileNames.get(sharedGameState);
            if (addedPileName !== undefined) {
              await ie.gainFromPile(addedPileName);
            }
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);

    const toDiscard: Card | Choice = await ie
      .chooseCard('Discard a card')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    if (toDiscard instanceof Card) {
      await ie.discardCardFromLocation(toDiscard, CardLocation.HAND);
    }
  }
}
