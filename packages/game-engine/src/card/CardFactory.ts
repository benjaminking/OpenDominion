import { CardLocation } from '@dominion/common';

import * as cards from '../cards/index';
import { SharedGameState } from '../game-state/SharedGameState';
import { convertToClassName } from '../NameUtils';
import { Card } from './Card';

// Card classes by lower-case class name, so a card can also be created from its display name
// (e.g. 'Overgrown Estate') or from a class name that differs only in case ('HornofPlenty')
const classNamesByLowerCaseName = new Map<string, string>(
  Object.keys(cards).map((className: string) => [className.toLowerCase(), className]),
);

export class CardFactory {
  constructor(private readonly sharedGameState: SharedGameState) {}

  public createCard(name: string, id: string, location: CardLocation): Card {
    try {
      const className = classNamesByLowerCaseName.get(convertToClassName(name).toLowerCase()) ?? name;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const card: Card = new (cards as any)[className](this.sharedGameState);
      card.setId(id);
      card.setLocation(location);
      return card;
    } catch (e) {
      throw new Error(`Unable to create card with name ${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
