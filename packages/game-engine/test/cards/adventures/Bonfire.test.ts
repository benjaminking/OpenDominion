import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardChoice, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Bonfire } from '../../../src/cards/adventures/Bonfire';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { createCardHarness } from '../testHarness';

// Adventures is not registered in CardInfoLookup yet, so supply Bonfire's card info directly
const bonfireInfo: CardInfo = {
  name: 'Bonfire',
  category: CardCategory.EVENT,
  text: 'Trash up to 2 Coppers you have in play.',
  font_size: 'large',
  cost: { coins: 3 },
  types: [],
  expansion: Expansion.ADVENTURES,
  has_randomizer: false,
};
const lookUpRegisteredCardInfo = CardInfoLookup.lookUpCardInfo.bind(CardInfoLookup);
vi.spyOn(CardInfoLookup, 'lookUpCardInfo').mockImplementation((cardName: string) =>
  cardName === bonfireInfo.name ? bonfireInfo : lookUpRegisteredCardInfo(cardName),
);

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Bonfire', () => {
  it('is an Event costing $3', () => {
    const testHarness = createCardHarness();
    const bonfire = new Bonfire(testHarness.sharedGameState);

    expect(bonfire.getName()).toBe('Bonfire');
    expect(bonfire.getCost().coins).toBe(3);
  });

  it('trashes up to 2 chosen Coppers you have in play', async () => {
    const testHarness = createCardHarness();
    const inPlayCoppers: Copper[] = [];
    for (let i = 0; i < 3; i++) {
      const copper = new Copper(testHarness.sharedGameState);
      copper.setId(`copper-in-play-${String(i)}`);
      inPlayCoppers.push(copper);
      testHarness.addToInPlay(copper);
    }

    testHarness.pickCards([inPlayCoppers[0], inPlayCoppers[1]]);
    await new Bonfire(testHarness.sharedGameState).onBuy(testHarness.executor);

    expect(cardIds(testHarness.sharedTrash)).toEqual([inPlayCoppers[0].getId(), inPlayCoppers[1].getId()]);
    expect(cardIds(testHarness.inPlay)).toEqual([inPlayCoppers[2].getId()]);
  });

  it('only offers Coppers in play, up to 2 of them', async () => {
    const testHarness = createCardHarness();
    const inPlayCopper = new Copper(testHarness.sharedGameState);
    inPlayCopper.setId('copper-in-play');
    testHarness.addToInPlay(inPlayCopper);
    const inPlaySilver = new Silver(testHarness.sharedGameState);
    inPlaySilver.setId('silver-in-play');
    testHarness.addToInPlay(inPlaySilver);
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand');
    testHarness.addToHand(handCopper);

    await new Bonfire(testHarness.sharedGameState).onBuy(testHarness.executor);

    const [, , , allowedNumbers, offeredChoices] = testHarness.decisionService.chooseCards.mock.calls[0] as unknown as [
      string,
      string,
      string,
      number[],
      CardChoice[],
    ];
    expect(allowedNumbers).toEqual([0, 1, 2]);
    expect(offeredChoices.map((choice) => choice.card.id)).toEqual([inPlayCopper.getId()]);
  });

  it('trashes nothing when no Coppers are chosen', async () => {
    const testHarness = createCardHarness();
    const inPlayCopper = new Copper(testHarness.sharedGameState);
    inPlayCopper.setId('copper-in-play');
    testHarness.addToInPlay(inPlayCopper);

    // default: no cards chosen
    await new Bonfire(testHarness.sharedGameState).onBuy(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(cardIds(testHarness.inPlay)).toEqual([inPlayCopper.getId()]);
  });
});
