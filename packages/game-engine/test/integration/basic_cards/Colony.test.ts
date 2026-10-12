import { GameOutcome } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Colony', () => {
  it('has 8 cards with 2 players and 12 with 3 or more', () => {
    expect(createGame({ useColoniesPlatinum: true }).pileSize('Colony')).toBe(8);
    expect(createGame({ useColoniesPlatinum: true, players: ['Alice', 'Bob', 'Cara'] }).pileSize('Colony')).toBe(12);
  });

  it('ends the game at the end of the turn when the Colony pile is empty', async () => {
    const game = createGame({ useColoniesPlatinum: true });
    game.alice.setHand(['Platinum', 'Platinum', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Colony', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Colony');

    expect(game.pileSize('Colony')).toBe(0);
    expect(game.isFinished).toBe(true);
  });

  it('is worth 10 VP at the end of the game', async () => {
    const game = createGame({ kingdom: ["Worker's Village"], useColoniesPlatinum: true });
    game.alice.setHand(["Worker's Village", 'Platinum', 'Platinum', 'Platinum', 'Gold']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    game.bob.setHand(['Province', 'Duchy', 'Duchy', 'Duchy', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction("Worker's Village");
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(21);
    await game.buy('Colony');
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const results = game.state.getGameResult()!.playerResults;
    const alice = results.find((result) => result.playerName === 'Alice')!;
    const bob = results.find((result) => result.playerName === 'Bob')!;
    expect(alice.scoreReport.total).toBe(16);
    expect(bob.scoreReport.total).toBe(15);
    expect(alice.outcome).toBe(GameOutcome.WIN);
  });

  it('ends the game only after the turn when a gain (not a buy) takes the last Colony', async () => {
    const game = createGame({ kingdom: ['Expand'], useColoniesPlatinum: true });
    game.alice.setHand(['Expand', 'Platinum', 'Gold', 'Silver', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Colony', 1);

    await game.start();
    await game.playAction('Expand');
    await game.chooseCard('Platinum');
    await game.chooseCard('Colony');

    expect(game.pileSize('Colony')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Duchy');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Colony', 'Duchy']));
  });

  it('scores 10 VP wherever it is, while Platinum and Potion score nothing', async () => {
    const game = createGame({ kingdom: ['Golem'], useColoniesPlatinum: true });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Colony', 'Potion']);
    game.alice.setDeck(['Colony', 'Platinum', ...coppers(5)]);
    game.alice.setDiscard(['Colony', 'Platinum', 'Potion']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const alice = game.state.getGameResult()!.playerResults.find((result) => result.playerName === 'Alice')!;
    // Three Colonies and a Province
    expect(alice.scoreReport.total).toBe(36);
  });

  it('has 12 cards with 4 players', () => {
    const game = createGame({ useColoniesPlatinum: true, players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    expect(game.pileSize('Colony')).toBe(12);
  });
});
