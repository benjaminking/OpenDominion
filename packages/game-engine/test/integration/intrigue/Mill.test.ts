import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Mill', () => {
  it('lets a player with only 1 card in hand discard it, without getting +$2', async () => {
    const game = createGame({ kingdom: ['Mill'] });
    game.alice.setHand(['Mill']);
    game.alice.setDeck(['Estate', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards(['Estate']);

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.coins).toBe(0);
  });

  it('may discard nothing, for no +$2', async () => {
    const game = createGame({ kingdom: ['Mill'] });
    game.alice.setHand(['Mill', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Mill');
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(decision.numSelectedEligibility).toContain(0);
    expect(decision.numSelectedEligibility).not.toContain(3);
    await game.chooseCards([]);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate']);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.actions).toBe(1);
  });

  it('gives +$2 for discarding exactly the last 2 cards in hand', async () => {
    const game = createGame({ kingdom: ['Mill'] });
    game.alice.setHand(['Mill', 'Estate']);
    game.alice.setDeck(['Curse', ...coppers(10)]);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards(['Estate', 'Curse']);

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.coins).toBe(2);
  });

  it('can discard 2 cards for +$2 on each play by Throne Room', async () => {
    const game = createGame({ kingdom: ['Mill', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Mill', 'Estate', 'Estate', 'Curse']);
    game.alice.setDeck(['Copper', 'Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mill');
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseCards(['Curse', 'Copper']);

    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toEqual(['Copper']);
  });

  it('is worth 1VP in play, counted at the end of the game', async () => {
    const game = createGame({ kingdom: ['Mill'] });
    game.alice.setHand(['Mill', 'Gold', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(['Copper', ...coppers(10)]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards([]);
    expect(game.alice.inPlay).toEqual(['Mill']);
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    // Province 6 + Estate 1 + Mill 1
    expect(aliceResult?.scoreReport.total).toBe(8);
  });

  it('still gives +$2 when a discarded Weaver is played instead of staying in the discard pile', async () => {
    const game = createGame({ kingdom: ['Mill', 'Weaver'] });
    game.alice.setHand(['Mill', 'Weaver', 'Estate']);
    game.alice.setDeck(['Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    expect(game.alice.inPlay).toEqual(['Mill', 'Weaver']);
    expect(game.alice.coins).toBe(2);
    expect([...game.alice.discard].sort()).toEqual(['Estate', 'Silver', 'Silver']);
  });

  it('is worth 1VP on the Native Village mat', async () => {
    const game = createGame({ kingdom: ['Mill', 'Native Village'] });
    game.alice.setHand(['Native Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Mill', ...coppers(10)]);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption('Put the top card of your deck face down on your Native Village mat');

    expect(game.alice.nativeVillageMat).toEqual(['Mill']);
    expect(game.alice.score).toBe(1);
  });

  it('still gives +1 Action and lets the player discard when there is no card to draw', async () => {
    const game = createGame({ kingdom: ['Mill'] });
    game.alice.setHand(['Mill', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.actions).toBe(1);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual([]);
  });

  it('gives +$2 when one of the discarded cards is a Tunnel revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Mill', 'Tunnel'] });
    game.alice.setHand(['Mill', 'Tunnel', 'Estate']);
    game.alice.setDeck(['Copper', ...coppers(10)]);

    await game.start();
    await game.playAction('Mill');
    await game.chooseCards(['Tunnel', 'Estate']);
    await game.chooseEffect('Tunnel');

    expect([...game.alice.discard].sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(game.alice.coins).toBe(2);
  });
});
