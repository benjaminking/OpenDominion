import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Farm', () => {
  it('is played as a Treasure in the Buy phase, not as an Action', async () => {
    const game = createGame({ kingdom: ['Farm'] });
    game.alice.setHand(['Farm', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();

    // With no Action cards in hand, Alice goes straight to playing Treasures
    const decision = game.expectDecision('treasurePhase', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name)).toContain('Farm');
    await game.playTreasure('Farm');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.inPlay).toEqual(['Farm']);
  });

  it('is worth 2VP wherever it is', async () => {
    const game = createGame({ kingdom: ['Farm'] });
    game.alice.setHand(['Farm', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Farm', 'Copper']);
    game.alice.setDiscard(['Farm', 'Estate']);

    await game.start();

    expect(game.alice.score).toBe(7);
  });

  it('gives 2 choices to Courtier, for its Treasure and Victory types', async () => {
    const game = createGame({ kingdom: ['Farm', 'Courtier'] });
    game.alice.setHand(['Courtier', 'Farm', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Courtier');
    await game.chooseCard('Farm');

    expect(game.expectDecision('chooseMultipleOptions', 'Alice').numToSelect).toBe(2);
  });

  it('is played twice by Coronet in the Buy phase', async () => {
    const game = createGame({ kingdom: ['Farm'] });
    game.alice.setHand(['Coronet', 'Farm', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    // No non-Reward Action in hand; Farm is the Treasure to play twice
    if (game.pending.kind === 'chooseCard' && !game.pending.cardChoices.some((choice) => choice.card.name === 'Farm')) {
      await game.chooseNone();
    }
    await game.chooseCard('Farm');

    expect(game.alice.coins).toBe(4);
    expect(game.alice.inPlay).toEqual(['Coronet', 'Farm']);
  });

  it('is worth 2VP while in play at the end of the game', async () => {
    const game = createGame({ kingdom: ['Farm'] });
    game.alice.setHand(['Farm', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playTreasure('Farm');
    await game.playAllTreasures();
    expect(game.alice.inPlay).toContain('Farm');
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    // Province 6 + Farm 2 + 2 Estates
    expect(aliceResult?.scoreReport.total).toBe(10);
  });
});
