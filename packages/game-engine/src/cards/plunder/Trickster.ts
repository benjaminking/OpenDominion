import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OnceThisTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Trickster extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trickster'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.attack.bind(this));

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(
          new CardEligibilityFunction(
            (card) => isTreasureCard.matches(card) && card.getLocation() === CardLocation.IN_PLAY,
          ),
        )
        .withExpiration(new OnceThisTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, discardedCards: CardCollection) => {
            const treasuresInPlay = discardedCards.getMatchingCards(
              new CardEligibilityFunction(
                (card) => isTreasureCard.matches(card) && card.getLocation() === CardLocation.IN_PLAY,
              ),
            );
            const cardToSetAside: Card | Choice = await effectIe
              .chooseCard('You may set aside a discarded Treasure from play')
              .from(treasuresInPlay)
              .to(CardSelectionPurpose.OTHER)
              .allowNoneOption()
              .choose();
            if (!(cardToSetAside instanceof Card)) {
              return;
            }

            await effectIe.setCardAsideFromLocation(cardToSetAside, CardLocation.IN_PLAY);
            effectIe.addEffect(
              new Effect.Builder()
                .from(this)
                .triggerOn(EffectTriggerType.TURN_END, EffectSource.SELF)
                .onTurn(effectIe.createThisTurnEligibilityFunction())
                .withExpiration(new OnceThisTurnEffectExpiration(effectIe.getSharedGameState().getCurrentTurn()))
                .makeMandatory()
                .action(
                  new EffectAction((turnEndIe: InstructionExecutor) => {
                    turnEndIe.putCardIntoHandFromLocation(cardToSetAside, CardLocation.SET_ASIDE);
                  }),
                )
                .build(),
            );
          }),
        )
        .build(),
    );
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().gainFromPile('Curse');
  }
}
