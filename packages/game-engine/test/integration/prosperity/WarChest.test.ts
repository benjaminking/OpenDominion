import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredNames = (game: GameHarness): string[] => game.pending.cardChoices.map((choice) => choice.card.name);

describe('War Chest', () => {
  it('has the player to the left name a card, then gains a card up to $5 that was not named (3 players)', async () => {
    const game = createGame({ kingdom: ['War Chest', 'Village'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['War Chest', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('War Chest');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Village');

    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(gain.noneAllowed).toBe(false);
    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).toContain('Duchy');
    expect(offeredNames(game)).not.toContain('Village');
    expect(offeredNames(game)).not.toContain('Gold');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('excludes every card named for War Chest this turn when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ['War Chest', 'Tiara', 'Village', 'Smithy'] });
    game.alice.setHand(['Tiara', 'War Chest', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    // Tiara offers to put the gained Village onto the deck
    await game.declineEffects();
    await game.chooseCard('Smithy');

    expect(offeredNames(game)).not.toContain('Silver');
    expect(offeredNames(game)).not.toContain('Smithy');
    expect(offeredNames(game)).toContain('Village');
    await game.chooseCard('Village');
    await game.declineEffects();
    expect(game.alice.discard).toEqual(['Village', 'Village']);
  });

  it('allows cards named on an earlier turn', async () => {
    const game = createGame({ kingdom: ['War Chest'] });
    game.alice.setHand(['War Chest', 'Estate', 'Estate', 'Estate', 'Estate']);
    // Alice draws another War Chest in clean-up
    game.alice.setDeck(['War Chest', 'Estate', 'Estate', 'Estate', 'Estate', ...coppers(5)]);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playTreasure('War Chest');
    await game.chooseCard('Duchy');
    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).not.toContain('Duchy');
  });

  it('can gain a Gold while Highway makes it cost $5', async () => {
    const game = createGame({ kingdom: ['War Chest', 'Highway'] });
    game.alice.setHand(['Highway', 'War Chest', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');

    expect(offeredNames(game)).toContain('Gold');
    expect(offeredNames(game)).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('still gains a card when the named card has an empty pile', async () => {
    const game = createGame({ kingdom: ['War Chest', 'Village'] });
    game.alice.setHand(['War Chest', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);

    await game.start();
    await game.playTreasure('War Chest');
    await game.chooseCard('Village');

    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).toContain('Duchy');
    await game.chooseCard('Duchy');
    expect(game.alice.discard).toEqual(['Duchy']);
  });

  it("can't gain a card with a Potion in its cost", async () => {
    const game = createGame({ kingdom: ['War Chest', 'Familiar'] });
    game.alice.setHand(['War Chest', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');

    expect(offeredNames(game)).toContain('Potion');
    expect(offeredNames(game)).not.toContain('Familiar');
  });

  it('can gain a Peddler at its Buy-phase cost of $4 with two Action cards in play', async () => {
    const game = createGame({ kingdom: ['War Chest', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'Village', 'War Chest', 'War Chest', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Village');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');

    expect(offeredNames(game)).toContain('Peddler');
    await game.chooseCard('Peddler');
    expect(game.alice.discard).toEqual(['Peddler']);
  });

  it("can't gain a Peddler that costs $6 with one Action card in play", async () => {
    const game = createGame({ kingdom: ['War Chest', 'Peddler', 'Village'] });
    game.alice.setHand(['Village', 'War Chest', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');

    expect(offeredNames(game)).not.toContain('Peddler');
  });

  it('allows cards named on the previous turn on an Outpost extra turn', async () => {
    const game = createGame({ kingdom: ['War Chest', 'Outpost', 'Village'] });
    game.alice.setHand(['Outpost', 'War Chest', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['War Chest', 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    await game.endBuyPhase();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    await game.playTreasure('War Chest');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Duchy');
    expect(offeredNames(game)).toContain('Silver');
    expect(offeredNames(game)).not.toContain('Duchy');
  });

  it('has the player to the left name the card, wrapping around to the first player (3 players)', async () => {
    const game = createGame({ kingdom: ['War Chest'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    cara.setHand(['War Chest', 'Estate', 'Estate', 'Estate', 'Estate']);
    cara.setDeck(coppers(10));

    await game.start();
    await game.endTurn();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
    await game.playTreasure('War Chest');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Silver');
    game.expectDecision('chooseCard', 'Cara');
    expect(offeredNames(game)).not.toContain('Silver');
    await game.chooseCard('Duchy');

    expect(cara.discard).toEqual(['Duchy']);
  });
});
