import { NamedChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { CrystalBall } from '../../../src/cards/prosperity/CrystalBall';
import { CardHarness, createCardHarness } from '../testHarness';

const offeredOptionNames = (testHarness: CardHarness): string[] =>
  ((testHarness.decisionService.chooseOneOption.mock.calls[0] as unknown[])[2] as NamedChoice[]).map(
    (choice) => choice.name,
  );

describe('CrystalBall', () => {
  it('adds $1 and does nothing else when there are no cards to look at', async () => {
    const testHarness = createCardHarness();

    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
  });

  it('can trash the top card of the deck', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    testHarness.addToDeck(estate);

    testHarness.pickOption('Trash it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.sharedTrash.contains(estate)).toBe(true);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('can discard the top card of the deck', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-1');
    testHarness.addToDeck(estate);

    testHarness.pickOption('Discard it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['estate-deck-1']);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0']);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('only offers to play the card if it is an Action or Treasure', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    testHarness.addToDeck(estate);

    testHarness.pickOption('Discard it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(offeredOptionNames(testHarness)).toContain('Trash it');
    expect(offeredOptionNames(testHarness)).toContain('Discard it');
    expect(offeredOptionNames(testHarness)).not.toContain('Play it');
  });

  it('can play a Treasure from the top of the deck', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    testHarness.addToDeck(silver);

    testHarness.pickOption('Play it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(3);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('can play an Action from the top of the deck', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck-1');
    testHarness.addToDeck(village);

    testHarness.pickOption('Play it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0']);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(1);
  });

  // BUG: playCardFromLocation takes the card out of limbo but never puts it into play, so it vanishes
  it('puts a card played from the deck into play', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    testHarness.addToDeck(silver);

    testHarness.pickOption('Play it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.inPlay.contains(silver)).toBe(true);
  });

  // BUG: trashing, discarding and playing are all optional, but there is no option to leave the card on the deck
  it('lets you leave the top card on your deck', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    testHarness.addToDeck(estate);

    testHarness.pickOption('Discard it');
    await new CrystalBall(testHarness.sharedGameState).play(testHarness.executor);

    const otherOptions = offeredOptionNames(testHarness).filter(
      (name) => !['Trash it', 'Discard it', 'Play it'].includes(name),
    );
    expect(otherOptions).toHaveLength(1);
  });
});
