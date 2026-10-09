import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Housecarl } from '../../../src/cards/cornucopia_and_guilds/Housecarl';
import { createCardHarness } from '../testHarness';

describe('Housecarl', () => {
  it('draws 1 card per differently named Action card in play, counting itself', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }
    const housecarl = new Housecarl(testHarness.sharedGameState);
    housecarl.setId('housecarl-0');
    testHarness.addToInPlay(housecarl);
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const playedVillage = new Village(testHarness.sharedGameState);
      playedVillage.setId(`village-in-play-${String(cardIndex)}`);
      testHarness.addToInPlay(playedVillage);
    }
    const playedSmithy = new Smithy(testHarness.sharedGameState);
    playedSmithy.setId('smithy-in-play-0');
    testHarness.addToInPlay(playedSmithy);
    const playedCopper = new Copper(testHarness.sharedGameState);
    playedCopper.setId('copper-in-play-0');
    testHarness.addToInPlay(playedCopper);

    // Housecarl, Village and Smithy: 3 differently named Actions
    await housecarl.play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(2);
  });
});
