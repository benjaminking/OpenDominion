import '@angular/compiler';
import { CardLocation, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MiscellaneousCardDialogService } from '../src/app/shared/miscellaneous-card-dialog.service';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    displayName: name,
    id,
    location: CardLocation.PILE,
    types: [CardType.ACTION, CardType.REWARD],
    cost: { coins: 0 },
  };
}

describe('MiscellaneousCardDialogService', () => {
  it('starts with no cards', () => {
    const service = new MiscellaneousCardDialogService();

    expect(service.getCards()()).toEqual([]);
  });

  it('replaces the displayed cards and updates previously obtained signals', () => {
    const service = new MiscellaneousCardDialogService();
    const cardsSignal = service.getCards();
    const coronet = createCard('Coronet', 'coronet-1');
    const renown = createCard('Renown', 'renown-1');

    service.setCards([coronet, renown]);
    expect(cardsSignal()).toEqual([coronet, renown]);

    service.setCards([renown]);
    expect(cardsSignal()).toEqual([renown]);
    expect(service.getCards()).toBe(cardsSignal);

    service.setCards([]);
    expect(cardsSignal()).toEqual([]);
  });
});
