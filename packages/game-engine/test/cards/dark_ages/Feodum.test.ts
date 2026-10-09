import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Feodum } from '../../../src/cards/dark_ages/Feodum';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const createSilvers = (testHarness: CardHarness, count: number, prefix: string): Silver[] => {
  const silvers: Silver[] = [];
  for (let cardIndex = 0; cardIndex < count; cardIndex++) {
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId(`silver-${prefix}-${String(cardIndex)}`);
    silvers.push(silver);
  }
  return silvers;
};

describe('Feodum', () => {
  it('is worth 1 VP per 3 Silvers across all card groups, rounded down', () => {
    const testHarness = createCardHarness();
    const feodum = new Feodum(testHarness.sharedGameState);
    feodum.setId('feodum-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-0');

    expect(feodum.score([])).toBe(0);
    expect(feodum.score([CardCollection.fromCards([feodum, copper, ...createSilvers(testHarness, 2, 'a')])])).toBe(0);
    expect(feodum.score([CardCollection.fromCards(createSilvers(testHarness, 3, 'a'))])).toBe(1);
    expect(
      feodum.score([
        CardCollection.fromCards(createSilvers(testHarness, 4, 'a')),
        CardCollection.fromCards([copper]),
        CardCollection.fromCards(createSilvers(testHarness, 4, 'b')),
      ]),
    ).toBe(2);
  });

  // BUG: gains from lowercase pile 'silver', but pile names are case-sensitive, so nothing is gained
  it('when trashed, gains 3 Silvers', async () => {
    const testHarness = createCardHarness();
    const feodum = new Feodum(testHarness.sharedGameState);
    feodum.setId('feodum-0');
    for (const silver of createSilvers(testHarness, 4, 'supply')) {
      testHarness.addSupplyPile(silver);
    }

    const [onTrash] = testHarness.getCardEffects(feodum, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, feodum);

    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.discard.asCardArray().every((card) => card.getName() === 'Silver')).toBe(true);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
  });

  // BUG: gains from lowercase pile 'silver', but pile names are case-sensitive, so nothing is gained
  it('when trashed with fewer than 3 Silvers left, gains the rest', async () => {
    const testHarness = createCardHarness();
    const feodum = new Feodum(testHarness.sharedGameState);
    feodum.setId('feodum-0');
    for (const silver of createSilvers(testHarness, 2, 'supply')) {
      testHarness.addSupplyPile(silver);
    }

    const [onTrash] = testHarness.getCardEffects(feodum, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, feodum);

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.pileCards.get('Silver')).toEqual([]);
  });
});
