import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { HornOfPlenty } from '../../../src/cards/cornucopia_and_guilds/HornOfPlenty';
import { CardHarness, createCardHarness } from '../testHarness';

const putHornOfPlentyInPlay = (testHarness: CardHarness): HornOfPlenty => {
  const hornOfPlenty = new HornOfPlenty(testHarness.sharedGameState);
  hornOfPlenty.setId('horn-of-plenty-0');
  testHarness.addToInPlay(hornOfPlenty);
  return hornOfPlenty;
};

describe('HornOfPlenty', () => {
  it('gains a card costing up to $1 per differently named card in play, counting itself', async () => {
    const testHarness = createCardHarness();
    const hornOfPlenty = putHornOfPlentyInPlay(testHarness);
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const playedCopper = new Copper(testHarness.sharedGameState);
      playedCopper.setId(`copper-in-play-${String(cardIndex)}`);
      testHarness.addToInPlay(playedCopper);
    }
    const playedSilver = new Silver(testHarness.sharedGameState);
    playedSilver.setId('silver-in-play-0');
    testHarness.addToInPlay(playedSilver);
    // 3 different names in play, so a $3 Village is gainable
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    testHarness.pickCard(village);
    await hornOfPlenty.play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([village]);
    expect(testHarness.inPlay.contains(hornOfPlenty)).toBe(true);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('cannot gain a card costing more than the number of differently named cards in play', async () => {
    const testHarness = createCardHarness();
    const hornOfPlenty = putHornOfPlentyInPlay(testHarness);
    const playedCopper = new Copper(testHarness.sharedGameState);
    playedCopper.setId('copper-in-play-0');
    testHarness.addToInPlay(playedCopper);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    testHarness.pickCard(village);
    await hornOfPlenty.play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.piles.getPileSizeByName('Village')).toBe(1);
  });

  it('trashes itself when the gained card is a Victory card', async () => {
    const testHarness = createCardHarness();
    const hornOfPlenty = putHornOfPlentyInPlay(testHarness);
    const playedCopper = new Copper(testHarness.sharedGameState);
    playedCopper.setId('copper-in-play-0');
    testHarness.addToInPlay(playedCopper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    testHarness.pickCard(estate);
    await hornOfPlenty.play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([estate]);
    expect(testHarness.inPlay.contains(hornOfPlenty)).toBe(false);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([hornOfPlenty]);
  });
});
