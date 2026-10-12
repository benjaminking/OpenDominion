import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

/** The cost shown for a Supply card in the pending decision, or undefined if it isn't offered. */
const offeredCost = (game: GameHarness, cardName: string): number | undefined =>
  game.pending.cardChoices.find((choice) => choice.card.name === cardName && choice.card.location === CardLocation.PILE)
    ?.card.cost.coins;

/** The current cost of the top card of a Supply pile, whether or not it is affordable. */
const currentCost = (game: GameHarness, pileName: string): number =>
  game.state.piles.getTopCardOfPile(pileName)!.getCost().coins;

describe('Quarry', () => {
  it('makes Action cards cost $2 less in the Buy phase, but not below $0 and not other cards', async () => {
    const game = createGame({ kingdom: ['Quarry', "King's Court", 'Village', 'Cellar'] });
    game.alice.setHand(['Quarry', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Quarry');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(7);
    expect(offeredCost(game, "King's Court")).toBe(5);
    expect(offeredCost(game, 'Village')).toBe(1);
    expect(offeredCost(game, 'Cellar')).toBe(0);
    expect(offeredCost(game, 'Silver')).toBe(3);
    expect(offeredCost(game, 'Duchy')).toBe(5);
  });

  it("is cumulative: with two Quarries, King's Court costs $3", async () => {
    const game = createGame({ kingdom: ['Quarry', "King's Court"] });
    game.alice.setHand(['Quarry', 'Quarry', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Quarry');
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    expect(offeredCost(game, "King's Court")).toBe(3);
    await game.buy("King's Court");

    expect(game.alice.discard).toContain("King's Court");
  });

  it("doesn't change costs on other players' turns", async () => {
    const game = createGame({ kingdom: ['Quarry', "King's Court"] });
    game.alice.setHand(['Quarry', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Gold', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Quarry');
    expect(currentCost(game, "King's Court")).toBe(5);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    await game.playAllTreasures();
    expect(game.bob.coins).toBe(7);
    expect(offeredCost(game, "King's Court")).toBe(7);
  });

  it('makes Action cards cost $4 less when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ['Quarry', 'Tiara', "King's Court"] });
    game.alice.setHand(['Tiara', 'Quarry', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Quarry');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(3);
    expect(offeredCost(game, "King's Court")).toBe(3);
  });

  it("is cumulative with Bridge and Highway: King's Court costs $3", async () => {
    const game = createGame({ kingdom: ['Quarry', 'Bridge', 'Highway', "King's Court"] });
    game.alice.setHand(['Highway', 'Bridge', 'Quarry', 'Gold', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Bridge');
    await game.playTreasure('Quarry');

    // $7 - $1 (Highway) - $1 (Bridge) - $2 (Quarry); Duchy only gets the $2 from Highway and Bridge
    expect(currentCost(game, "King's Court")).toBe(3);
    expect(currentCost(game, 'Duchy')).toBe(3);
    expect(currentCost(game, 'Village')).toBe(0);
  });

  it("doesn't carry over to an Outpost extra turn", async () => {
    const game = createGame({ kingdom: ['Quarry', 'Outpost', "King's Court"] });
    game.alice.setHand(['Outpost', 'Quarry', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold', 'Gold', 'Copper', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure('Quarry');
    expect(currentCost(game, "King's Court")).toBe(5);
    await game.endBuyPhase();
    await game.chooseExtraTurn('Outpost');
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(7);
    expect(offeredCost(game, "King's Court")).toBe(7);
  });

  it("reduces costs for another player's gains during your turn, e.g. Swindler", async () => {
    const game = createGame({ kingdom: ['Quarry', 'Crystal Ball', 'Swindler', 'Smithy'] });
    game.alice.setHand(['Quarry', 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Swindler', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Smithy', ...coppers(5)]);

    await game.start();
    await game.playTreasure('Quarry');
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');

    // Bob's trashed Smithy costs $2 this turn, so Bob gains a card costing exactly $2
    expect(game.trash).toEqual(['Smithy']);
    game.expectDecision('chooseCard', 'Alice');
    expect(offeredCost(game, 'Estate')).toBe(2);
    expect(offeredCost(game, 'Smithy')).toBe(2);
    expect(offeredCost(game, 'Silver')).toBeUndefined();
    await game.chooseCard('Smithy');

    expect(game.bob.discard).toEqual(['Smithy']);
  });

  it('keeps reducing costs for the rest of the turn after gaining a Mint trashed it', async () => {
    const game = createGame({ kingdom: ['Quarry', 'Mint', "Worker's Village", "King's Court", 'Smithy'] });
    game.alice.setHand(["Worker's Village", 'Quarry', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("Worker's Village");
    await game.playTreasure('Quarry');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    // Mint is an Action card: it costs $3
    expect(offeredCost(game, 'Mint')).toBe(3);
    await game.buy('Mint');

    expect(game.trash).toContain('Quarry');
    expect(currentCost(game, "King's Court")).toBe(5);
    expect(offeredCost(game, 'Smithy')).toBe(2);
    await game.buy('Smithy');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Mint', 'Smithy']));
  });
});
