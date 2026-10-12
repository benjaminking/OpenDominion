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

describe('Peddler', () => {
  it('costs $2 less per Action card you have in play during your Buy phase', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Village', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(4);
    expect(offeredCost(game, 'Peddler')).toBe(4);
    await game.buy('Peddler');

    expect(game.alice.discard).toContain('Peddler');
  });

  it("counts Action cards in play, not plays: King's Court on Worker's Village is two Action cards", async () => {
    const game = createGame({ kingdom: ['Peddler', "King's Court", "Worker's Village"] });
    game.alice.setHand(["King's Court", "Worker's Village", 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard("Worker's Village");
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(3);
    expect(currentCost(game, 'Peddler')).toBe(4);
  });

  it('costs $8 outside the Buy phase, even with Action cards in play', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Village', 'Expand'] });
    game.alice.setHand(['Village', 'Expand', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Expand');
    await game.chooseCard('Silver');

    // Up to $6: Gold is offered, Peddler ($8) is not
    expect(offeredCost(game, 'Gold')).toBe(6);
    expect(offeredCost(game, 'Peddler')).toBeUndefined();
  });

  it('can be gained by a Treasure in the Buy phase at its reduced cost', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Village', 'Anvil'] });
    game.alice.setHand(['Village', 'Village', 'Anvil', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playTreasure('Anvil');
    await game.chooseCard('Copper');

    // Anvil gains a card costing up to $4
    expect(offeredCost(game, 'Peddler')).toBe(4);
    await game.chooseCard('Peddler');
    expect(game.alice.discard).toEqual(['Copper', 'Peddler']);
  });

  it('is cumulative with Quarry', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Village', 'Quarry'] });
    game.alice.setHand(['Village', 'Quarry', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playTreasure('Quarry');

    // $8, -$2 for Quarry, -$2 for the Village in play
    expect(currentCost(game, 'Peddler')).toBe(4);
  });

  it('counts a Duration Action card still in play from your previous turn', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Wharf'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Wharf');
    await game.endTurn();
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Wharf');
    }
    expect(game.alice.inPlay).toEqual(['Wharf']);

    // No Actions in hand, so Alice is in her Buy phase
    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
    expect(currentCost(game, 'Peddler')).toBe(6);
  });

  it("doesn't count another player's Action cards in play during your Buy phase", async () => {
    const game = createGame({ kingdom: ['Peddler', 'Wharf'] });
    game.alice.setHand(['Wharf', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(30));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Wharf');
    await game.endTurn();
    // Alice's Wharf is still in play during Bob's turn
    expect(game.alice.inPlay).toEqual(['Wharf']);
    await game.playAllTreasures();

    expect(game.expectDecision(['treasurePhase', 'buyPhase'], 'Bob')).toBeDefined();
    expect(currentCost(game, 'Peddler')).toBe(8);
  });

  it('counts a Coronet played in the Buy phase as an Action card in play, until gaining Mint trashes it', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Mint', "Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Coronet', 'Gold', 'Silver', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("Worker's Village");
    await game.endActionPhase();
    expect(currentCost(game, 'Peddler')).toBe(6);
    await game.playTreasure('Coronet');
    await game.chooseCard('Silver');
    expect(currentCost(game, 'Peddler')).toBe(4);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    // Mint trashes the Coronet (and the other Treasures), leaving only Worker's Village in play
    await game.buy('Mint');

    expect(game.expectDecision('buyPhase', 'Alice').numBuys).toBe(1);
    expect(game.alice.inPlay).toEqual(["Worker's Village"]);
    expect(currentCost(game, 'Peddler')).toBe(6);
  });

  it('is cumulative with Highway, which is itself an Action card in play', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Highway'] });
    game.alice.setHand(['Highway', 'Village', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    // Still in the Action phase: only Highway's -$1
    expect(game.expectDecision('actionPhase', 'Alice')).toBeDefined();
    expect(currentCost(game, 'Peddler')).toBe(7);
    await game.endActionPhase();

    // Buy phase: -$1 for Highway, -$2 for the one Action card in play
    expect(currentCost(game, 'Peddler')).toBe(5);
  });

  it('costs less as soon as Crystal Ball plays an Action card in the Buy phase', async () => {
    const game = createGame({ kingdom: ['Peddler', 'Crystal Ball', 'Village'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Village', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    expect(currentCost(game, 'Peddler')).toBe(8);
    await game.chooseOption('Play it');

    expect(game.alice.inPlay).toEqual(['Crystal Ball', 'Village']);
    expect(currentCost(game, 'Peddler')).toBe(6);
  });

  it("makes another player's Peddler cost less during your Buy phase, e.g. for Swindler", async () => {
    const game = createGame({ kingdom: ['Peddler', 'Crystal Ball', 'Swindler', 'Village', 'Smithy'] });
    game.alice.setHand(['Village', 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Swindler', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Peddler', ...coppers(5)]);

    await game.start();
    await game.playAction('Village');
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    // Alice has Village and Swindler in play: Bob's trashed Peddler costs $4
    expect(game.trash).toEqual(['Peddler']);
    game.expectDecision('chooseCard', 'Alice');
    expect(offeredCost(game, 'Smithy')).toBe(4);
    expect(offeredCost(game, 'Peddler')).toBe(4);
    expect(offeredCost(game, 'Silver')).toBeUndefined();
    await game.chooseCard('Smithy');

    expect(game.bob.discard).toEqual(['Smithy']);
  });
});
