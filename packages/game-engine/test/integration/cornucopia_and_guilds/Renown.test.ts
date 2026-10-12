import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('Renown', () => {
  it('played twice by Throne Room, makes cards cost $4 less', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Renown', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Renown');
    expect(game.alice.buys).toBe(3);
    await game.playAllTreasures();

    // With $1: Duchy ($5) costs $1, Gold ($6) costs $2
    expect(offeredNames(game)).toContain('Duchy');
    expect(offeredNames(game)).not.toContain('Gold');
  });

  it('lets Remake turn a Copper into a Silver, since Silver costs $1 and Copper still costs $0', async () => {
    const game = createGame({ kingdom: ['Remake'] });
    game.alice.setHand(['Village', 'Renown', 'Remake', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Renown');
    await game.playAction('Remake');
    await game.chooseCard('Copper');
    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).not.toContain('Copper');
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('two Renowns make Herald cost $0, and all the remaining $ can be overpaid', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Village', 'Renown', 'Renown', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Renown');
    await game.playAction('Renown');
    await game.playAllTreasures();
    await game.buy('Herald');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Herald');
    }

    expect(game.pending.options).toContain('$3');
    expect(game.pending.options).not.toContain('$4');
  });

  it('lowers the cost of the Action cards that Stonemason can gain by overpaying', async () => {
    const game = createGame({ kingdom: ['Stonemason'] });
    game.alice.setHand(['Renown', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Renown');
    await game.playAllTreasures();
    expect(game.costOf('Stonemason').coins).toBe(0);
    await game.buy('Stonemason');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Stonemason');
    }
    // Stonemason now costs $0, so all $4 can be overpaid
    expect(game.pending.options).toContain('$4');
    await game.chooseOption('$1');

    // Village and Workshop ($3) now cost $1; Smithy ($4) costs $2
    expect(offeredNames(game)).toEqual(expect.arrayContaining(['Village', 'Workshop']));
    expect(offeredNames(game)).not.toContain('Smithy');
    await game.chooseCard('Village');
    await game.chooseCard('Workshop');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Stonemason', 'Village', 'Workshop']));
  });

  it("also lowers costs for another player's gain during Alice's turn: Bob's Weaver discarded to Militia can gain a Gold", async () => {
    const game = createGame({ kingdom: ['Militia', 'Weaver'] });
    game.alice.setHand(['Village', 'Renown', 'Militia', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Weaver', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Renown');
    await game.playAction('Militia');
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Weaver', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');

    // Gold costs $4 this turn
    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Estate', 'Gold']));
  });

  it('stacks with Bridge and Highway', async () => {
    const game = createGame({ kingdom: ['Bridge', 'Highway'] });
    game.alice.setHand(['Village', 'Highway', 'Bridge', 'Renown']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Highway');
    await game.playAction('Bridge');
    expect(game.costOf('Province').coins).toBe(6);
    await game.playAction('Renown');

    expect(game.costOf('Province').coins).toBe(4);
    expect(game.costOf('Gold').coins).toBe(2);
    expect(game.costOf('Silver').coins).toBe(0);
  });

  it('lowers only the $ part of a Potion cost', async () => {
    const game = createGame({ kingdom: ['Alchemist', 'Vineyard'] });
    game.alice.setHand(['Renown', 'Potion', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Renown');

    expect(game.costOf('Alchemist').coins).toBe(1);
    expect(game.costOf('Alchemist').potions).toBe(1);
    expect(game.costOf('Vineyard').coins).toBe(0);
    expect(game.costOf('Vineyard').potions).toBe(1);
    await game.playAllTreasures();
    await game.buy('Alchemist');
    expect(game.alice.discard).toEqual(['Alchemist']);
    expect(game.alice.potions).toBe(0);
  });

  it('does not lower costs on an Outpost extra turn, which is a new turn', async () => {
    const game = createGame({ kingdom: ['Outpost'] });
    game.alice.setHand(['Village', 'Renown', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Renown');
    await game.playAction('Outpost');
    expect(game.costOf('Gold').coins).toBe(4);
    await game.endTurn();
    if (game.pending.kind === 'chooseExtraTurns') {
      await game.chooseExtraTurn('Outpost');
    }

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.costOf('Gold').coins).toBe(6);
  });
});
