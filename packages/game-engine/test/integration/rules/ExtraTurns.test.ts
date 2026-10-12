import { GameOutcome } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

const outcomeOf = (game: GameHarness, playerName: string): GameOutcome | undefined =>
  game.gameResult?.playerResults.find((result) => result.playerName === playerName)?.outcome;

describe('Extra turns', () => {
  it("lets a player take an Outpost turn right after another player's Outpost turn", async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 20));
    game.bob.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(copies('Copper', 20));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    expect(game.currentPlayerName).toBe('Alice');
    await game.endTurn();

    // Bob's previous turn wasn't his, so his Outpost works even though Alice just had two turns in a row
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAction('Outpost');
    await game.endTurn();
    expect(game.expectDecision('chooseExtraTurns', 'Bob').extraTurns.map((turn) => turn.name)).toEqual(['Outpost']);
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.hand).toHaveLength(3);
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Alice');
  });

  it('ends the game at the end of the turn, before the extra turn Outpost would give', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.setPileSize('Province', 1);
    game.alice.setHand(['Outpost', 'Gold', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(copies('Copper', 20));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Outpost');
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    expect(game.alice.hand).toHaveLength(3);
  });

  it("ends the game at the end of the Outpost turn when the last Province is bought then, so the next player doesn't play", async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.setPileSize('Province', 1);
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold', 'Gold', ...copies('Copper', 20)]);
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    expect(game.bob.discard).toEqual([]);
  });

  it("doesn't count an Outpost turn for the tie-breaker", async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.setPileSize('Province', 1);
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Province', ...copies('Copper', 20)]);
    game.bob.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    await game.playAllTreasures();
    await game.buy('Province');

    // 6 VP each; Alice had one turn plus an extra turn, Bob one turn: a shared victory
    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(6);
    expect(game.bob.score).toBe(6);
    expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.TIE);
    expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.TIE);
  });

  it('passes to the next player in turn order after an Outpost turn in a 3-player game', async () => {
    const game = createGame({ kingdom: ['Outpost'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 20));
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
  });
});
