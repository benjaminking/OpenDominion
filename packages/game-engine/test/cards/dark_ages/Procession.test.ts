import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Artisan } from '../../../src/cards/base_game/Artisan';
import { Festival } from '../../../src/cards/base_game/Festival';
import { Gardens } from '../../../src/cards/base_game/Gardens';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Pillage } from '../../../src/cards/dark_ages/Pillage';
import { Procession } from '../../../src/cards/dark_ages/Procession';
import { Spoils } from '../../../src/cards/dark_ages/Spoils';
import { Haven } from '../../../src/cards/seaside/Haven';
import { CardHarness, createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const addCoppersToDeck = (harness: CardHarness, count: number): void => {
  for (let i = 0; i < count; i++) {
    const deckCopper = new Copper(harness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    harness.addToDeck(deckCopper);
  }
};

describe('Procession', () => {
  it('plays the chosen Action twice, trashes it and gains an Action costing exactly $1 more', async () => {
    const testHarness = createCardHarness();
    const handVillage = new Village(testHarness.sharedGameState);
    handVillage.setId('village-hand-0');
    testHarness.addToHand(handVillage);
    addCoppersToDeck(testHarness, 4);
    const supplySmithy = new Smithy(testHarness.sharedGameState);
    supplySmithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(supplySmithy);
    const supplyFestival = new Festival(testHarness.sharedGameState);
    supplyFestival.setId('festival-supply-0');
    testHarness.addSupplyPile(supplyFestival);

    testHarness.pickCard(handVillage);
    testHarness.pickCard(supplySmithy);
    await new Procession(testHarness.sharedGameState).play(testHarness.executor);

    // Village twice: +2 Cards, +4 Actions
    expect(testHarness.stats.actions).toBe(4);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['village-hand-0']);
    expect(idsOf(testHarness.discard)).toEqual(['smithy-supply-0']);
  });

  it('gains nothing when no Action card costs exactly $1 more', async () => {
    const testHarness = createCardHarness();
    const handVillage = new Village(testHarness.sharedGameState);
    handVillage.setId('village-hand-0');
    testHarness.addToHand(handVillage);
    addCoppersToDeck(testHarness, 4);
    // $4 non-Action, $5 Action and $3 Action: none qualify for a $3 Village
    const supplyGardens = new Gardens(testHarness.sharedGameState);
    supplyGardens.setId('gardens-supply-0');
    testHarness.addSupplyPile(supplyGardens);
    const supplyFestival = new Festival(testHarness.sharedGameState);
    supplyFestival.setId('festival-supply-0');
    testHarness.addSupplyPile(supplyFestival);
    const supplyVillage = new Village(testHarness.sharedGameState);
    supplyVillage.setId('village-supply-0');
    testHarness.addSupplyPile(supplyVillage);

    testHarness.pickCard(handVillage);
    testHarness.pickCard(supplyGardens);
    await new Procession(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.sharedTrash)).toEqual(['village-hand-0']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing when no card is chosen', async () => {
    const testHarness = createCardHarness();
    const handVillage = new Village(testHarness.sharedGameState);
    handVillage.setId('village-hand-0');
    testHarness.addToHand(handVillage);

    await new Procession(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['village-hand-0']);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('cannot play a Duration or non-Action card', async () => {
    const testHarness = createCardHarness();
    const handHaven = new Haven(testHarness.sharedGameState);
    handHaven.setId('haven-hand-0');
    testHarness.addToHand(handHaven);
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);

    testHarness.pickCard(handHaven);
    await new Procession(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['haven-hand-0', 'copper-hand-0']);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('still gains a card when the played card already trashed itself', async () => {
    const testHarness = createCardHarness();
    const handPillage = new Pillage(testHarness.sharedGameState);
    handPillage.setId('pillage-hand-0');
    testHarness.addToHand(handPillage);
    const spoilsPile: Spoils[] = [];
    for (let i = 0; i < 4; i++) {
      const spoils = new Spoils(testHarness.sharedGameState);
      spoils.setId(`spoils-pile-${String(i)}`);
      spoilsPile.push(spoils);
    }
    testHarness.pileCards.set('Spoils', spoilsPile);
    const supplyArtisan = new Artisan(testHarness.sharedGameState);
    supplyArtisan.setId('artisan-supply-0');
    testHarness.addSupplyPile(supplyArtisan);

    testHarness.pickCard(handPillage);
    testHarness.pickCard(supplyArtisan);
    await new Procession(testHarness.sharedGameState).play(testHarness.executor);

    // Pillage trashes itself on the first play, so the second play and Procession's trash do nothing
    expect(idsOf(testHarness.sharedTrash)).toEqual(['pillage-hand-0']);
    expect(idsOf(testHarness.discard)).toEqual(['spoils-pile-0', 'spoils-pile-1', 'artisan-supply-0']);
  });
});
