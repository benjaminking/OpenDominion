import { CardLocation } from '@dominion/common';

import * as cards from '../cards/index';
import { SharedGameState } from '../game-state/SharedGameState';
import { Card } from './Card';

export class CardFactory {
  constructor(private readonly sharedGameState: SharedGameState) {}

  public createCard(name: string, id: string, location: CardLocation): Card {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card: Card = new (cards as any)[name](this.sharedGameState);
      card.setId(id);
      card.setLocation(location);
      return card;
    } catch (e) {
      throw new Error(`Unable to create card with name ${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
