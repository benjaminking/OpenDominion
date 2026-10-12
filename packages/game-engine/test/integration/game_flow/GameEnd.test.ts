import { GameOutcome } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const resultOf = (game: GameHarness, playerName: string) =>
  game.gameResult?.playerResults.find((result) => result.playerName === playerName);

const outcomeOf = (game: GameHarness, playerName: string): GameOutcome | undefined =>
  resultOf(game, playerName)?.outcome;

describe('Game end', () => {
  describe('when it is checked', () => {
    it('does not end the game when the last Province is exchanged back to its pile by Trader before the turn ends', async () => {
      const game = createGame({ kingdom: ['Trader'] });
      game.alice.setHand(['Trader', 'Gold', 'Gold', 'Silver', 'Estate']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(coppers(5));
      game.bob.setDeck(coppers(10));
      game.setPileSize('Province', 1);

      await game.start();
      await game.endActionPhase();
      await game.playAllTreasures();
      await game.buy('Province');
      expect(game.pileSize('Province')).toBe(0);
      await game.chooseEffect('Trader');

      // The Province pile is no longer empty at the end of the turn
      expect(game.pileSize('Province')).toBe(1);
      expect(game.isFinished).toBe(false);
      expect(game.currentPlayerName).toBe('Bob');
      expect(game.alice.discard).toContain('Silver');
      expect(game.alice.discard).not.toContain('Province');
    });

    it('does not end the game when the third empty Supply pile is refilled by Trader before the turn ends', async () => {
      const game = createGame({ kingdom: ['Trader', 'Village', 'Smithy', 'Market'] });
      game.alice.setHand(['Trader', 'Gold', 'Silver', 'Estate', 'Estate']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(coppers(5));
      game.bob.setDeck(coppers(10));
      game.setPileSize('Village', 0);
      game.setPileSize('Smithy', 0);
      game.setPileSize('Market', 1);

      await game.start();
      await game.endActionPhase();
      await game.playAllTreasures();
      await game.buy('Market');
      await game.chooseEffect('Trader');

      expect(game.state.piles.numEmptySupplyPiles).toBe(2);
      expect(game.isFinished).toBe(false);
      expect(game.currentPlayerName).toBe('Bob');
    });

    it('ends the game after the turn in which the Province pile empties, even in a game using Colonies', async () => {
      const game = createGame({ useColoniesPlatinum: true });
      game.alice.setHand(['Gold', 'Gold', 'Silver', 'Estate', 'Estate']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(coppers(5));
      game.bob.setDeck(coppers(10));
      game.setPileSize('Province', 1);

      await game.start();
      await game.playAllTreasures();
      await game.buy('Province');

      expect(game.pileSize('Colony')).toBe(8);
      expect(game.isFinished).toBe(true);
      expect(resultOf(game, 'Alice')?.scoreReport.total).toBe(8);
    });
  });

  describe('three empty Supply piles', () => {
    it('ignores empty non-Supply piles (Madman, Spoils, Mercenary), but ends on a third empty Supply pile', async () => {
      const game = createGame({ kingdom: ['Hermit', 'Bandit Camp', 'Urchin', 'Village', 'Smithy', 'Market'] });
      game.alice.setHand(coppers(5));
      game.alice.setDeck(coppers(10));
      game.bob.setHand(['Gold', 'Silver', 'Estate', 'Estate', 'Estate']);
      game.bob.setDeck(coppers(10));
      game.setPileSize('Madman', 0);
      game.setPileSize('Spoils', 0);
      game.setPileSize('Mercenary', 0);
      game.setPileSize('Village', 0);
      game.setPileSize('Smithy', 0);
      game.setPileSize('Market', 1);

      await game.start();
      await game.endTurn();

      expect(game.isFinished).toBe(false);
      expect(game.currentPlayerName).toBe('Bob');
      await game.playAllTreasures();
      await game.buy('Market');

      expect(game.isFinished).toBe(true);
    });

    it('counts the Ruins pile, emptied by an Attack, as a Supply pile', async () => {
      const game = createGame({ kingdom: ['Marauder', 'Village', 'Smithy'] });
      game.alice.setHand(['Marauder', 'Copper', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(coppers(5));
      game.bob.setDeck(coppers(10));
      game.setPileSize('Village', 0);
      game.setPileSize('Smithy', 0);
      game.setPileSize('Ruins', 1);

      await game.start();
      await game.playAction('Marauder');
      expect(game.pileSize('Ruins')).toBe(0);
      // Not mid-turn: Alice still gets her Buy phase
      expect(game.isFinished).toBe(false);
      await game.playAllTreasures();
      await game.buy('Silver');

      expect(game.isFinished).toBe(true);
    });

    it('counts the Knights pile as a Supply pile', async () => {
      const game = createGame({ kingdom: ['Knights', 'Village', 'Smithy'] });
      game.alice.setHand(['Gold', 'Silver', 'Estate', 'Estate', 'Estate']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(coppers(5));
      game.bob.setDeck(coppers(10));
      game.setPileSize('Village', 0);
      game.setPileSize('Smithy', 0);
      game.setPile('Knights', ['Dame Anna']);

      await game.start();
      await game.playAllTreasures();
      await game.buy('Dame Anna');

      expect(game.pileSize('Knights')).toBe(0);
      expect(game.isFinished).toBe(true);
    });

    it('counts the Curse pile emptied by Charlatan, and the Curse still scores -1', async () => {
      const game = createGame({ kingdom: ['Charlatan', 'Village', 'Smithy'] });
      game.alice.setHand(['Charlatan', 'Copper', 'Copper', 'Estate', 'Estate']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(['Duchy', 'Copper', 'Copper', 'Copper', 'Copper']);
      game.bob.setDeck(coppers(10));
      game.setPileSize('Village', 0);
      game.setPileSize('Smithy', 0);
      game.setPileSize('Curse', 1);

      await game.start();
      await game.playAction('Charlatan');
      await game.playAllTreasures();
      await game.buy('Silver');

      expect(game.isFinished).toBe(true);
      // Duchy (3) and the Curse (-1)
      expect(resultOf(game, 'Bob')?.scoreReport.total).toBe(2);
      expect(resultOf(game, 'Alice')?.scoreReport.total).toBe(2);
      // Tied on 2 VP: Bob had fewer turns
      expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.WIN);
    });

    it('counts the Potion and Platinum piles as Supply piles', async () => {
      const game = createGame({ kingdom: ['Golem'], useColoniesPlatinum: true });
      game.alice.setHand(['Gold', 'Silver', 'Estate', 'Estate', 'Estate']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(coppers(5));
      game.bob.setDeck(coppers(10));
      game.setPileSize('Potion', 0);
      game.setPileSize('Platinum', 0);
      game.setPileSize('Silver', 1);

      await game.start();
      await game.playAllTreasures();
      await game.buy('Silver');

      expect(game.isFinished).toBe(true);
    });
  });

  describe('winner and tie-breaker', () => {
    it('shares the victory between two tied players with fewer turns than a third tied player (3 players)', async () => {
      const game = createGame({ players: ['Alice', 'Bob', 'Cara'] });
      game.alice.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(['Province', 'Copper', 'Copper', 'Copper', 'Copper']);
      game.player('Cara').setHand(['Province', 'Copper', 'Copper', 'Copper', 'Copper']);
      game.setPileSize('Province', 1);

      await game.start();
      await game.playAllTreasures();
      await game.buy('Province');

      expect(game.isFinished).toBe(true);
      expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.LOSS);
      expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.TIE);
      expect(outcomeOf(game, 'Cara')).toBe(GameOutcome.TIE);
    });

    it('gives the win to the tied player with fewer turns, ignoring a lower-scoring player (3 players)', async () => {
      const game = createGame({ players: ['Alice', 'Bob', 'Cara'] });
      const cara = game.player('Cara');
      game.alice.setHand(['Province', 'Estate', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(coppers(10));
      game.bob.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);
      game.bob.setDeck(coppers(10));
      cara.setHand(['Province', 'Estate', 'Copper', 'Copper', 'Copper']);
      game.setPileSize('Province', 1);

      await game.start();
      await game.endTurn();
      await game.playAllTreasures();
      await game.buy('Province');

      // Alice 7 VP (1 turn), Bob 6 VP (1 turn), Cara 7 VP (no turns)
      expect(game.isFinished).toBe(true);
      expect(outcomeOf(game, 'Cara')).toBe(GameOutcome.WIN);
      expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.LOSS);
      expect(outcomeOf(game, 'Bob')).toBe(GameOutcome.LOSS);
    });

    it('counts VP tokens, so they can win a game that would otherwise go to the tie-breaker', async () => {
      const game = createGame({ kingdom: ['Monument', "Worker's Village"] });
      game.alice.setHand(["Worker's Village", 'Monument', 'Gold', 'Gold', 'Estate']);
      game.alice.setDeck(['Copper', ...coppers(10)]);
      game.bob.setHand(['Province', 'Estate', 'Copper', 'Copper', 'Copper']);
      game.bob.setDeck(coppers(10));
      game.setPileSize('Province', 1);

      await game.start();
      await game.playAction("Worker's Village");
      await game.playAction('Monument');
      await game.playAllTreasures();
      expect(game.alice.coins).toBe(9);
      await game.buy('Province');
      await game.endBuyPhase();

      // Alice: Province, Estate and 1 VP token (8); Bob: Province and Estate (7)
      expect(game.isFinished).toBe(true);
      expect(resultOf(game, 'Alice')?.scoreReport.total).toBe(8);
      expect(resultOf(game, 'Bob')?.scoreReport.total).toBe(7);
      expect(outcomeOf(game, 'Alice')).toBe(GameOutcome.WIN);
    });
  });

  describe('Supply sizes', () => {
    it('uses 12-card Victory piles, 12 Colonies and 30 Curses and Ruins in a 4-player game', () => {
      const game = createGame({
        kingdom: ['Charlatan', 'Cultist'],
        players: ['Alice', 'Bob', 'Cara', 'Dan'],
        useColoniesPlatinum: true,
      });

      expect(game.pileSize('Estate')).toBe(12);
      expect(game.pileSize('Duchy')).toBe(12);
      expect(game.pileSize('Province')).toBe(12);
      expect(game.pileSize('Colony')).toBe(12);
      expect(game.pileSize('Curse')).toBe(30);
      expect(game.pileSize('Ruins')).toBe(30);
      expect(game.pileSize('Copper')).toBe(32);
    });

    it('uses 8-card Victory piles, 10 Curses and 46 Coppers with 2 players', () => {
      const game = createGame();

      expect(game.pileSize('Estate')).toBe(8);
      expect(game.pileSize('Duchy')).toBe(8);
      expect(game.pileSize('Province')).toBe(8);
      expect(game.pileSize('Curse')).toBe(10);
      expect(game.pileSize('Copper')).toBe(46);
      expect(game.pileSize('Silver')).toBe(40);
      expect(game.pileSize('Gold')).toBe(30);
    });

    it('uses 12-card Victory piles, 20 Curses and 39 Coppers with 3 players', () => {
      const game = createGame({ players: ['Alice', 'Bob', 'Cara'], useColoniesPlatinum: true });

      expect(game.pileSize('Estate')).toBe(12);
      expect(game.pileSize('Duchy')).toBe(12);
      expect(game.pileSize('Province')).toBe(12);
      expect(game.pileSize('Colony')).toBe(12);
      expect(game.pileSize('Curse')).toBe(20);
      expect(game.pileSize('Copper')).toBe(39);
      expect(game.pileSize('Silver')).toBe(40);
      expect(game.pileSize('Gold')).toBe(30);
      expect(game.pileSize('Platinum')).toBe(12);
    });
  });
});

describe('Game end after a gain that is not a buy', () => {
  it("doesn't end the game mid-turn when a gain in the Buy phase empties the third Supply pile", async () => {
    const game = createGame({ kingdom: ['War Chest', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['War Chest', 'Gold', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 1);

    await game.start();
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Market');
    expect(game.state.piles.numEmptySupplyPiles).toBe(3);
    expect(game.isFinished).toBe(false);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Market', 'Silver']));
  });
});
