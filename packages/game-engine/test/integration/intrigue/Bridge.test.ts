import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const costOf = (game: ReturnType<typeof createGame>, pileName: string): number =>
  game.state.cost(game.state.piles.getTopCardOfPile(pileName)!).coins;

describe('Bridge', () => {
  it('stacks when two Bridges are played, and the reduced cost is what is paid', async () => {
    const game = createGame({ kingdom: ['Bridge'] });
    game.alice.setHand(['Village', 'Bridge', 'Bridge', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(5);
    expect(costOf(game, 'Gold')).toBe(4);
    expect(costOf(game, 'Province')).toBe(6);
    await game.buy('Gold');
    expect(game.alice.coins).toBe(1);
    expect(game.alice.discard).toContain('Gold');
  });

  it('reduces costs twice when played by Throne Room', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Bridge', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Bridge');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(5);
    expect(game.alice.buys).toBe(3);
    expect(costOf(game, 'Province')).toBe(6);
    expect(costOf(game, 'Estate')).toBe(0);
  });

  it('does not reduce costs below $0', async () => {
    const game = createGame({ kingdom: ['Bridge'] });
    game.alice.setHand(['Village', 'Village', 'Bridge', 'Bridge', 'Bridge']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.alice.addToHand('Copper');

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    await game.playAction('Bridge');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(6);
    expect(costOf(game, 'Estate')).toBe(0);
    expect(costOf(game, 'Copper')).toBe(0);
    expect(costOf(game, 'Silver')).toBe(0);
    expect(costOf(game, 'Province')).toBe(5);
    // Buying a $0 card leaves the coins untouched
    await game.buy('Estate');
    expect(game.alice.coins).toBe(6);
  });

  it('stops reducing costs at the end of the turn', async () => {
    const game = createGame({ kingdom: ['Bridge'] });
    game.alice.setHand(['Bridge', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Silver', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Bridge');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    game.expectDecision('treasurePhase', 'Bob');
    await game.playAllTreasures();
    expect(game.bob.coins).toBe(7);
    expect(costOf(game, 'Gold')).toBe(6);
    expect(costOf(game, 'Province')).toBe(8);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).not.toContain('Province');
  });

  it('stacks with Highway', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Highway'] });
    game.alice.setHand(['Highway', 'Bridge', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Bridge');

    expect(costOf(game, 'Province')).toBe(6);
    expect(costOf(game, 'Silver')).toBe(1);
    expect(costOf(game, 'Estate')).toBe(0);
  });

  it('reduces only the coin part of a Potion cost', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Golem', 'Vineyard'] });
    game.alice.setHand(['Bridge', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bridge');

    expect(game.costOf('Golem').coins).toBe(3);
    expect(game.costOf('Golem').potions).toBe(1);
    expect(game.costOf('Vineyard').coins).toBe(0);
    expect(game.costOf('Vineyard').potions).toBe(1);
    expect(game.costOf('Potion').coins).toBe(3);
  });

  it('still reduces costs when played by Band of Misfits from the Supply', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Bridge');

    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(costOf(game, 'Province')).toBe(7);
  });

  it('does not reduce costs during an extra turn from Outpost', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Outpost'] });
    game.alice.setHand(['Village', 'Bridge', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Outpost');
    expect(costOf(game, 'Province')).toBe(7);
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(costOf(game, 'Province')).toBe(8);
    expect(costOf(game, 'Silver')).toBe(3);
  });

  it('reduces costs twice when played twice by Coronet in the Buy phase', async () => {
    const game = createGame({ kingdom: ['Bridge'] });
    game.alice.setHand(['Coronet', 'Bridge', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Bridge');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseNone();
    }

    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
    expect(costOf(game, 'Province')).toBe(6);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Province');
    expect(game.alice.coins).toBe(3);
  });

  it('stacks with Quarry on Action cards, without going below $0', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Quarry'] });
    game.alice.setHand(['Bridge', 'Quarry', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bridge');
    await game.playTreasure('Quarry');

    expect(costOf(game, 'Smithy')).toBe(1);
    expect(costOf(game, 'Village')).toBe(0);
    expect(costOf(game, 'Bridge')).toBe(1);
    // Quarry only reduces Action cards
    expect(costOf(game, 'Province')).toBe(7);
    expect(costOf(game, 'Silver')).toBe(2);
  });

  it('stacks with Peddler in the Buy phase', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Peddler'] });
    game.alice.setHand(['Village', 'Bridge', 'Peddler', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    game.expectDecision('actionPhase', 'Alice');
    expect(costOf(game, 'Peddler')).toBe(7);
    await game.endActionPhase();

    // $8, -$2 for each of the 2 Actions in play, -$1 for Bridge
    expect(costOf(game, 'Peddler')).toBe(3);
  });

  it("reduces costs by $3 when played by King's Court", async () => {
    const game = createGame({ kingdom: ['Bridge', "King's Court"] });
    game.alice.setHand(["King's Court", 'Bridge', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Bridge');

    expect(game.alice.coins).toBe(3);
    expect(game.alice.buys).toBe(4);
    expect(costOf(game, 'Province')).toBe(5);
    expect(costOf(game, 'Silver')).toBe(0);
  });

  it('keeps reducing costs after Procession trashes it, and Procession uses its reduced cost', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Procession', 'Market', 'Village'] });
    game.alice.setHand(['Procession', 'Bridge', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Bridge');

    // Wiki rules clarification (Bridge): the reduction depends on how many times it was played, not on it being in play
    expect(game.trash).toEqual(['Bridge']);
    expect(costOf(game, 'Province')).toBe(6);
    // Bridge costs $2 now, so Procession gains an Action costing exactly $3: a printed-$5 one
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Market');
    expect(offered).not.toContain('Village');
    expect(offered).not.toContain('Smithy');
    await game.chooseCard('Market');
    expect(game.alice.discard).toEqual(['Market']);
    expect(costOf(game, 'Province')).toBe(6);
  });

  it("reduces costs for another player's gain during this turn: a Weaver played on the Bridge player's turn", async () => {
    const game = createGame({ kingdom: ['Bridge', 'Torturer', 'Weaver', 'Market'] });
    game.alice.setHand(['Village', 'Bridge', 'Torturer', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Bridge');
    await game.playAction('Torturer');
    await game.chooseOption('Discard 2 cards');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');

    const offered = game.expectDecision('chooseCard', 'Bob').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Market');
    expect(offered).toContain('Duchy');
    expect(offered).not.toContain('Gold');
    await game.chooseCard('Duchy');
    expect(game.bob.discard).toContain('Duchy');
  });
});
