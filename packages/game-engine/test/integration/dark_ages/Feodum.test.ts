import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Feodum', () => {
  it('scores 1 VP per 3 Silvers in all of your zones, rounded down', () => {
    const game = createGame({ kingdom: ['Feodum'] });
    const scoreWithSilvers = (numSilvers: number): number => {
      const silvers = Array<string>(numSilvers).fill('Silver');
      // Two Feodums and Silvers spread across hand, deck and discard
      game.alice.setHand(['Feodum', ...silvers.slice(0, 1)]);
      game.alice.setDeck(['Feodum', 'Copper', ...silvers.slice(1, 3)]);
      game.alice.setDiscard(silvers.slice(3));
      return game.alice.score;
    };

    expect(scoreWithSilvers(0)).toBe(0);
    expect(scoreWithSilvers(2)).toBe(0);
    expect(scoreWithSilvers(3)).toBe(2);
    expect(scoreWithSilvers(5)).toBe(2);
    expect(scoreWithSilvers(6)).toBe(4);
    expect(scoreWithSilvers(8)).toBe(4);
    expect(scoreWithSilvers(9)).toBe(6);
  });

  it('counts Silvers in play', async () => {
    const game = createGame({ kingdom: ['Feodum'] });
    game.alice.setHand(['Silver', 'Silver', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(['Feodum', ...COPPERS]);

    await game.start();
    await game.playAllTreasures();

    expect(game.alice.inPlay).toEqual(expect.arrayContaining(['Silver', 'Silver', 'Silver']));
    expect(game.alice.score).toBe(1);
  });

  it('gains 3 Silvers when trashed by your own card', async () => {
    const game = createGame({ kingdom: ['Feodum', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Feodum', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const silvers = game.pileSize('Silver');

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Feodum']);

    expect(game.trash).toEqual(['Feodum']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver', 'Silver']);
    expect(game.pileSize('Silver')).toBe(silvers - 3);
  });

  it("gains 3 Silvers for its owner when trashed by another player's Knight", async () => {
    const game = createGame({ kingdom: ['Feodum', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Feodum', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Feodum']);
    expect(game.bob.discard.filter((name) => name === 'Silver')).toHaveLength(3);
    expect(game.alice.discard).not.toContain('Silver');
    expect(game.currentPlayerName).toBe('Alice');
  });
});

describe('Feodum: interactions', () => {
  it('counts Silvers on the Native Village mat, and scores while on the Island mat', async () => {
    const game = createGame({ kingdom: ['Feodum', 'Native Village', 'Island'] });
    game.alice.setHand(['Native Village', 'Island', 'Feodum', 'Silver', 'Silver']);
    game.alice.setDeck(['Silver', ...COPPERS]);
    expect(game.alice.score).toBe(2 + 1);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption('Put the top card of your deck face down on your Native Village mat');
    await game.playAction('Island');
    await game.chooseCard('Feodum');

    expect(game.alice.nativeVillageMat).toEqual(['Silver']);
    expect(game.alice.islandMat).toEqual(['Island', 'Feodum']);
    // Island: 2 VP; Feodum: 3 Silvers (2 in hand, 1 on the Native Village mat) = 1 VP
    expect(game.alice.score).toBe(3);
  });

  it('when trashed by Count along with Silvers, gains 3 Silvers', async () => {
    const game = createGame({ kingdom: ['Feodum', 'Count'] });
    game.alice.setHand(['Count', 'Feodum', 'Silver', 'Silver', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Trash your hand');

    expect(game.trash).toEqual(['Feodum', 'Silver', 'Silver', 'Estate']);
    expect(game.alice.discard).toEqual(['Copper', 'Silver', 'Silver', 'Silver']);
  });

  it('counts a Silver set aside by Haven', async () => {
    const game = createGame({ kingdom: ['Feodum', 'Haven'] });
    game.alice.setHand(['Haven', 'Silver', 'Silver', 'Silver', 'Feodum']);
    game.alice.setDeck(COPPERS);
    expect(game.alice.score).toBe(1);

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Silver');

    expect(game.alice.setAside).toEqual(['Silver']);
    expect(game.alice.score).toBe(1);
  });

  it('is scored at the end of the game with the Silvers its owner has then', async () => {
    const game = createGame({ kingdom: ['Feodum'] });
    game.alice.setHand(['Gold', 'Gold', 'Silver', 'Silver', 'Copper']);
    game.alice.setDeck(['Feodum', 'Feodum', 'Silver', 'Silver', 'Silver', 'Silver', 'Copper', 'Copper']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    // 6 Silvers: each Feodum is worth 2 VP; Province 6 VP
    expect(aliceResult?.scoreReport.total).toBe(6 + 2 + 2);
  });

  it('when trashed, gaining the last Silvers as the third empty Supply pile ends the game only after the turn', async () => {
    const game = createGame({ kingdom: ['Feodum', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Feodum', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.setPileSize('Silver', 2);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Feodum']);

    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.pileSize('Silver')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });
});
