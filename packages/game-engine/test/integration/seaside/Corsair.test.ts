import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Corsair', () => {
  it('makes each other player trash only the first Silver or Gold they play on their turn', async () => {
    const game = createGame({ kingdom: ['Corsair'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Silver', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    cara.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.playTreasure('Silver');
    await game.playTreasure('Gold');
    await game.playTreasure('Silver');
    // The trashed Silver still made $2
    expect(game.bob.coins).toBe(7);
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.inPlay).toEqual(['Gold', 'Silver']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Cara');
    await game.playTreasure('Gold');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver', 'Gold']);
    expect(cara.inPlay).toEqual(['Silver']);
  });

  it('draws a card at the start of the next turn, and its attack ends when that turn starts', async () => {
    const game = createGame({ kingdom: ['Corsair'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Corsair']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.inPlay).toEqual(['Corsair']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.currentPlayerName).toBe('Bob');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual([]);
  });

  it('makes a player under two Corsair attacks trash only one card', async () => {
    const game = createGame({ kingdom: ['Corsair', 'Village'] });
    game.alice.setHand(['Village', 'Corsair', 'Corsair', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Silver', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Corsair');
    await game.playAction('Corsair');
    await game.endTurn();

    await game.playTreasure('Silver');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.inPlay).toEqual(['Silver']);
  });

  it('draws 2 cards at the start of the next turn when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Corsair', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Corsair', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Corsair');
    expect(game.alice.coins).toBe(4);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(7);
  });

  it('makes the target trash the first Silver or Gold on each of their turns, including an Outpost turn', async () => {
    const game = createGame({ kingdom: ['Corsair', 'Outpost'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Outpost', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', 'Copper', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    await game.playAction('Outpost');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.hand).toEqual(['Silver', 'Silver', 'Copper']);
    await game.playTreasure('Silver');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver', 'Silver']);
    expect(game.bob.inPlay).toEqual(['Outpost', 'Silver']);
    await game.endTurn();

    // The attack ends when Alice's next turn starts
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    await game.endTurn();

    expect(game.bob.hand).toContain('Silver');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver', 'Silver']);
  });

  it('makes a target who plays a Silver twice with Tiara trash it only once, still getting $2 for each play', async () => {
    const game = createGame({ kingdom: ['Corsair', 'Tiara'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Tiara', 'Silver', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    await game.playTreasure('Tiara');
    await game.chooseCard('Silver');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.coins).toBe(4);
    expect(game.bob.inPlay).toEqual(['Tiara']);

    // The other Silver isn't the first one played this turn
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.coins).toBe(6);
  });

  it('makes a target who plays a Gold twice with Coronet trash it only once, still getting $3 for each play', async () => {
    const game = createGame({ kingdom: ['Corsair'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Coronet', 'Gold', 'Silver', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Gold');
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.coins).toBe(6);

    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Gold']);
    expect(game.bob.inPlay).toEqual(['Coronet', 'Silver']);
  });

  it("makes a player attacked by two players' Corsairs trash only one card, and each attack ends separately", async () => {
    const game = createGame({ kingdom: ['Corsair'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Corsair', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(20));
    cara.setHand(['Silver', 'Silver', 'Gold', 'Copper', 'Copper']);
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    // Bob is attacked by Alice's Corsair; his own Corsair doesn't affect him
    await game.playAction('Corsair');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Cara');
    await game.playTreasure('Silver');
    await game.playTreasure('Gold');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver', 'Silver']);
    expect(cara.inPlay).toEqual(['Gold', 'Silver']);
    await game.endTurn();

    // Alice's own attack ended, but Bob's still applies to her
    expect(game.currentPlayerName).toBe('Alice');
    await resolveEffects(game);
    expect(game.alice.hand).toContain('Silver');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver', 'Silver', 'Silver']);
  });

  it('does not make a player who revealed Moat to it trash anything', async () => {
    const game = createGame({ kingdom: ['Corsair', 'Moat'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Moat', 'Silver', 'Gold', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    await game.chooseEffect('Moat');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    await game.endActionPhase();
    await game.playTreasure('Silver');
    await game.playTreasure('Gold');
    expect(game.trash).toEqual([]);
    expect(game.bob.inPlay).toEqual(['Silver', 'Gold']);
  });

  it("draws at the start of its owner's Outpost turn, when its attack also ends", async () => {
    const game = createGame({ kingdom: ['Corsair', 'Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Corsair', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Silver', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Corsair');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(4);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    await game.playTreasure('Silver');
    expect(game.trash).toEqual([]);
  });
  it('trashes only Silver or Gold: the first Silver after a Copper and a Platinum is trashed, the others are not', async () => {
    const game = createGame({ kingdom: ['Corsair'], useColoniesPlatinum: true });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Copper', 'Platinum', 'Silver', 'Gold', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    await game.playTreasure('Copper');
    await game.playTreasure('Platinum');
    expect(game.trash).toEqual([]);
    await game.playTreasure('Silver');
    await game.playTreasure('Gold');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.inPlay).toEqual(['Copper', 'Platinum', 'Gold']);
    expect(game.bob.coins).toBe(11);
  });

  it('lets the target discard Market Square to gain a Gold when their Silver is trashed', async () => {
    const game = createGame({ kingdom: ['Corsair', 'Market Square'] });
    game.alice.setHand(['Corsair', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Market Square', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Corsair');
    await game.endTurn();

    await game.endActionPhase();
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
    expect(offeredEffects(game.expectDecision('chooseFromMultipleEvents', 'Bob'))).toEqual(['Market Square']);
    await game.chooseEffect('Market Square');

    expect(game.bob.discard).toEqual(['Market Square', 'Gold']);
    expect(game.bob.coins).toBe(2);
  });

  it("played on an Outpost turn, attacks through the next player's turn and draws at the start of its owner's next turn", async () => {
    const game = createGame({ kingdom: ['Corsair', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Corsair', 'Copper', 'Copper', ...coppers(20)]);
    game.bob.setHand(['Silver', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    await game.playAction('Corsair');
    expect(game.alice.coins).toBe(2);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Corsair']);
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toHaveLength(6);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.bob.hand).toContain('Silver');
    await game.playTreasure('Silver');
    expect(game.trash).toEqual(['Silver']);
  });
});
