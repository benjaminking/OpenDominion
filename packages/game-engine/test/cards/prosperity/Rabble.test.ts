import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Rabble } from '../../../src/cards/prosperity/Rabble';
import { createCardHarness } from '../testHarness';

describe('Rabble', () => {
  it('draws 3 cards', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Rabble(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(1);
  });

  it('attack discards revealed Actions and Treasures and puts the rest back', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const duchy = new Duchy(targetHarness.sharedGameState);
    duchy.setId('duchy-target-deck-0');
    targetHarness.addToDeck(duchy);
    const estate = new Estate(targetHarness.sharedGameState);
    estate.setId('estate-target-deck-1');
    targetHarness.addToDeck(estate);
    const village = new Village(targetHarness.sharedGameState);
    village.setId('village-target-deck-2');
    targetHarness.addToDeck(village);
    const copper = new Copper(targetHarness.sharedGameState);
    copper.setId('copper-target-deck-3');
    targetHarness.addToDeck(copper);

    await new Rabble(testHarness.sharedGameState).play(testHarness.executor);

    expect(
      targetHarness.discard
        .asCardArray()
        .map((card) => card.getId())
        .sort(),
    ).toEqual(['copper-target-deck-3', 'village-target-deck-2']);
    // bottom to top
    expect(targetHarness.deck.asCardArray().map((card) => card.getId())).toEqual([
      'duchy-target-deck-0',
      'estate-target-deck-1',
    ]);
  });

  it('attack puts the remaining cards back in the order the target chooses', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const silver = new Silver(targetHarness.sharedGameState);
    silver.setId('silver-target-deck-0');
    targetHarness.addToDeck(silver);
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-target-deck-1');
    targetHarness.addToDeck(curse);
    const duchy = new Duchy(targetHarness.sharedGameState);
    duchy.setId('duchy-target-deck-2');
    targetHarness.addToDeck(duchy);
    const estate = new Estate(targetHarness.sharedGameState);
    estate.setId('estate-target-deck-3');
    targetHarness.addToDeck(estate);

    // Each chosen card goes on top of the previous one, so Curse ends up on top
    targetHarness.pickCard(estate);
    targetHarness.pickCard(duchy);
    await new Rabble(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(targetHarness.discard.size()).toBe(0);
    expect(targetHarness.deck.asCardArray().map((card) => card.getId())).toEqual([
      'silver-target-deck-0',
      'estate-target-deck-3',
      'duchy-target-deck-2',
      'curse-target-deck-1',
    ]);
  });

  it('attack only reveals the cards that are available', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const village = new Village(targetHarness.sharedGameState);
    village.setId('village-target-deck-0');
    targetHarness.addToDeck(village);

    await new Rabble(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(targetHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['village-target-deck-0']);
    expect(targetHarness.deck.size()).toBe(0);
  });
});
