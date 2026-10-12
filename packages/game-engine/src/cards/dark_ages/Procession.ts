import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import {
  both,
  costsExactlyNMoreThanCard,
  isActionCard,
  isDurationCard,
  not,
} from '../../StandardCardEligibilityFunctions';

export class Procession extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Procession'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToPlay: Card | Choice = await ie
      .chooseCard('Choose a non-Duration Action card from your hand to play twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isActionCard, not(isDurationCard)))
      .allowNoneOption()
      .choose();

    if (!(cardToPlay instanceof Card)) {
      return;
    }

    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await ie.playCardFromHandNTimes(cardToPlay, 2, this);
    if (locationExpectation.isMet(cardToPlay)) {
      await ie.trashCardFromLocation(cardToPlay, CardLocation.IN_PLAY);
    } else {
      ie.sendLostTrackMessage(cardToPlay);
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain an Action card costing exactly ' + cardToPlay.getCost().plus(1).toString())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsExactlyNMoreThanCard(cardToPlay, 1)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
