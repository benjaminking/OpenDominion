import { CardChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Familiar } from '../../../src/cards/alchemy/Familiar';
import { University } from '../../../src/cards/alchemy/University';
import { Artisan } from '../../../src/cards/base_game/Artisan';
import { Laboratory } from '../../../src/cards/base_game/Laboratory';
import { Village } from '../../../src/cards/base_game/Village';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { createCardHarness } from '../testHarness';

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('University', () => {
  it('gives +2 Actions and gains the chosen Action card costing up to $5', async () => {
    const testHarness = createCardHarness();
    const laboratory = new Laboratory(testHarness.sharedGameState);
    laboratory.setId('laboratory-supply-0');
    testHarness.addSupplyPile(laboratory);
    const nextLaboratory = new Laboratory(testHarness.sharedGameState);
    nextLaboratory.setId('laboratory-supply-1');
    testHarness.addSupplyPile(nextLaboratory);

    testHarness.pickCard(laboratory);
    await new University(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(cardIds(testHarness.discard)).toEqual([laboratory.getId()]);
    expect(cardIds(testHarness.pileCards.get('Laboratory') ?? [])).toEqual([nextLaboratory.getId()]);
  });

  it('may gain nothing', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    // default: choice returns none
    await new University(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
    expect(cardIds(testHarness.pileCards.get('Village') ?? [])).toEqual([village.getId()]);
  });

  it('only offers Action cards costing up to $5 without a Potion in the cost', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);
    const laboratory = new Laboratory(testHarness.sharedGameState);
    laboratory.setId('laboratory-supply-0');
    testHarness.addSupplyPile(laboratory);
    const artisan = new Artisan(testHarness.sharedGameState);
    artisan.setId('artisan-supply-0');
    testHarness.addSupplyPile(artisan);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const familiar = new Familiar(testHarness.sharedGameState);
    familiar.setId('familiar-supply-0');
    testHarness.addSupplyPile(familiar);

    await new University(testHarness.sharedGameState).play(testHarness.executor);

    const offeredChoices = (testHarness.decisionService.chooseCard.mock.calls[0] as unknown[])[3] as CardChoice[];
    expect(offeredChoices.map((choice) => choice.card.id)).toEqual(['village-supply-0', 'laboratory-supply-0']);
  });

  it('gains nothing when no Action card costs up to $5', async () => {
    const testHarness = createCardHarness();
    const artisan = new Artisan(testHarness.sharedGameState);
    artisan.setId('artisan-supply-0');
    testHarness.addSupplyPile(artisan);
    const familiar = new Familiar(testHarness.sharedGameState);
    familiar.setId('familiar-supply-0');
    testHarness.addSupplyPile(familiar);

    testHarness.pickCard(artisan);
    await new University(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
  });
});
