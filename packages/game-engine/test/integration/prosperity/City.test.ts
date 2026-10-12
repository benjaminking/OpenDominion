import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('City', () => {
  it('draws an extra card when one Supply pile is empty', async () => {
    const game = createGame({ kingdom: ['City', 'Village'] });
    game.alice.setHand(['City', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('City');

    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(1);
    expect(game.alice.coins).toBe(0);
  });

  it('also gives +1 Buy and +$1 with two or more empty Supply piles, with no further bonus for three', async () => {
    const game = createGame({ kingdom: ['City', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['City', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 0);

    await game.start();
    await game.playAction('City');

    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
  });

  it('counts a Supply pile that was emptied earlier in the turn', async () => {
    const game = createGame({ kingdom: ['City', 'Village', 'Workshop', 'Smithy'] });
    game.alice.setHand(['Village', 'Workshop', 'City', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Smithy', 1);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Workshop');
    await game.chooseCard('Smithy');
    expect(game.pileSize('Smithy')).toBe(0);
    await game.playAction('City');

    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(2);
  });

  it('does not count empty non-Supply piles', async () => {
    const game = createGame({ kingdom: ['City', 'Hermit'] });
    game.alice.setHand(['City', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Madman', 0);

    await game.start();
    await game.playAction('City');

    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.buys).toBe(1);
  });

  it('draws its two cards separately, shuffling the discard pile in between if needed', async () => {
    const game = createGame({ kingdom: ['City', 'Village'] });
    game.alice.setHand(['City', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('City');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Silver', 'Gold']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('still gives +2 Actions, +1 Buy and +$1 with no cards left to draw', async () => {
    const game = createGame({ kingdom: ['City', 'Village', 'Smithy'] });
    game.alice.setHand(['City', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('City');

    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
  });

  it("played by King's Court with two empty Supply piles, gives its full bonus three times", async () => {
    const game = createGame({ kingdom: ['City', "King's Court", 'Village', 'Smithy'] });
    game.alice.setHand(["King's Court", 'City', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('City');

    expect(game.alice.hand).toHaveLength(9);
    expect(game.alice.actions).toBe(6);
    expect(game.alice.buys).toBe(4);
    expect(game.alice.coins).toBe(3);
  });
});
