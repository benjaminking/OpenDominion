import { GameOutcome } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const outcomeOf = (game: GameHarness, playerName: string): GameOutcome | undefined =>
  game.state.getGameResult()?.playerResults.find((result) => result.playerName === playerName)?.outcome;

describe('Province', () => {
  it('has 8 cards with 2 players and 12 with 3 or more', () => {
    expect(createGame().pileSize('Province')).toBe(8);
    expect(createGame({ players: ['Alice', 'Bob', 'Cara'] }).pileSize('Province')).toBe(12);
  });

  it('ends the game at the end of the turn the last one is gained, not immediately', async () => {
    const game = createGame({ kingdom: ["Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Gold', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction("Worker's Village");
    await game.playAllTreasures();
    await game.buy('Province');
    expect(game.isFinished).toBe(false);
    expect(game.expectDecision('buyPhase', 'Alice').numBuys).toBe(1);
    await game.buy('Copper');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toContain('Copper');
  });

  it('breaks a tie in favour of the player who had fewer turns', async () => {
    const game = createGame();
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Province', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    // Both have 8 VP; Alice had 1 turn and Bob none
    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(8);
    expect(game.bob.score).toBe(8);
    expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.WIN);
    expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.LOSS);
  });

  it('is a shared victory when tied players had the same number of turns', async () => {
    const game = createGame();
    game.alice.setHand(['Province', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.endTurn();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.TIE);
    expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.TIE);
  });

  it('is not the only way to end the game: three empty Supply piles also end it', async () => {
    const game = createGame({ kingdom: ['Village', 'Smithy', 'Market'] });
    game.alice.setHand(['Gold', 'Gold', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Market');

    expect(game.pileSize('Province')).toBe(8);
    expect(game.isFinished).toBe(true);
  });
});
