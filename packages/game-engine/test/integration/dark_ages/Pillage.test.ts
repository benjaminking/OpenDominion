import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Pillage', () => {
  it('gains 2 Spoils, then attacks only the other players with 5 or more cards in hand', async () => {
    const game = createGame({ kingdom: ['Pillage'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Estate']);
    cara.setHand(['Gold', 'Silver', 'Copper', 'Copper']);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Pillage');

    // Alice has gained her Spoils before she chooses Bob's discard
    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.discard).toEqual(['Spoils', 'Spoils']);
    expect(choice.noneAllowed).toBe(false);
    expect(choice.cardChoices.map((cardChoice) => cardChoice.card.name).sort()).toEqual([
      'Copper',
      'Copper',
      'Estate',
      'Gold',
      'Silver',
    ]);
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Silver', 'Copper', 'Copper', 'Estate']);
    expect(game.bob.discard).toEqual(['Gold']);
    expect(cara.hand).toEqual(['Gold', 'Silver', 'Copper', 'Copper']);
    expect(game.trash).toEqual(['Pillage']);
    expect(game.pileSize('Spoils')).toBe(spoils - 2);
  });

  it('gains 2 Spoils and attacks only once when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Pillage', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Estate', 'Estate']);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Pillage');
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.pileSize('Spoils')).toBe(spoils - 2);
    expect(game.bob.hand).toHaveLength(5);
    expect(game.trash).toEqual(['Pillage']);
    // On the second play it is already in the trash: it has lost track of itself, so it didn't trash itself
    expect(game.alice.log).toContain('Alice has lost track of Pillage');
  });

  it('gains the last Spoils and still attacks when only one is left', async () => {
    const game = createGame({ kingdom: ['Pillage'] });
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Estate']);
    game.setPileSize('Spoils', 1);

    await game.start();
    await game.playAction('Pillage');
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Spoils']);
    expect(game.pileSize('Spoils')).toBe(0);
    expect(game.bob.discard).toEqual(['Silver']);
  });

  it('still gains 2 Spoils when Moat blocks the attack, and attacks the players who did not block it', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Moat', 'Gold', 'Silver', 'Copper', 'Copper']);
    cara.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Estate']);

    await game.start();
    await game.playAction('Pillage');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');

    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(choice.cardChoices.map((cardChoice) => cardChoice.card.name)).toContain('Estate');
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Spoils', 'Spoils']);
    expect(game.bob.hand).toHaveLength(5);
    expect(cara.discard).toEqual(['Gold']);
    expect(game.trash).toEqual(['Pillage']);
  });

  it('does not affect a player whose Diplomat leaves them with 4 cards in hand', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Diplomat'] });
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Pillage');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Silver', 'Gold']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate', 'Copper']);
    expect(game.alice.discard).toEqual(['Spoils', 'Spoils']);
  });

  it('still trashes itself and attacks when the Spoils pile is empty', async () => {
    const game = createGame({ kingdom: ['Pillage'] });
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Estate']);
    game.setPileSize('Spoils', 0);

    await game.start();
    await game.playAction('Pillage');
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Pillage']);
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Gold']);
  });

  it('makes the other player discard the card chosen for them, which can be a Tunnel that gains a Gold', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Tunnel'] });
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Tunnel', 'Silver', 'Copper', 'Copper', 'Estate']);

    await game.start();
    await game.playAction('Pillage');
    await game.chooseCard('Tunnel');

    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Tunnel');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.discard).toEqual(['Tunnel', 'Gold']);
    expect(game.bob.hand).toEqual(['Silver', 'Copper', 'Copper', 'Estate']);
  });

  it("lets its owner's Market Square react to Pillage trashing itself, before the Spoils are gained", async () => {
    const game = createGame({ kingdom: ['Pillage', 'Market Square'] });
    game.alice.setHand(['Pillage', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Pillage');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Market Square', 'Gold', 'Spoils', 'Spoils']);
  });

  it('attacks a player whose Guard Dog reaction takes them from 4 to 7 cards in hand', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Guard Dog'] });
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Guard Dog', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Silver', 'Estate', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Pillage');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Guard Dog');

    const choice = game.expectDecision('chooseCard', 'Alice');
    expect(choice.cardChoices).toHaveLength(7);
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.bob.hand).toHaveLength(6);
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
  });

  it('does not end the game by emptying the Spoils pile, which is not in the Supply', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Village', 'Smithy'] });
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);
    game.setPileSize('Spoils', 2);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('Pillage');
    expect(game.pileSize('Spoils')).toBe(0);
    await game.endTurn();

    expect(game.isFinished).toBe(false);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('does not affect a player with a Lighthouse in play from their previous turn, but still gains the Spoils', async () => {
    const game = createGame({ kingdom: ['Pillage', 'Lighthouse'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper', ...COPPERS]);
    game.bob.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Silver', 'Copper', 'Copper', 'Estate', ...COPPERS]);

    await game.start();
    await game.endTurn();
    await game.playAction('Lighthouse');
    await game.endTurn();
    expect(game.bob.inPlay).toEqual(['Lighthouse']);

    await game.playAction('Pillage');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Gold', 'Silver', 'Copper', 'Copper', 'Estate']);
    expect(game.alice.discard).toContain('Spoils');
    expect(game.trash).toEqual(['Pillage']);
  });

  it('in a 4-player game, lets the attacker choose for each player with 5 or more cards, in turn order from the left', async () => {
    const game = createGame({ kingdom: ['Pillage'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Pillage', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setHand(['Gold', 'Copper', 'Copper', 'Copper']);
    dan.setHand(['Silver', 'Estate', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Pillage');

    const forBob = game.expectDecision('chooseCard', 'Alice');
    expect(forBob.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Gold',
    ]);
    await game.chooseCard('Gold');

    // Cara has only 4 cards, so Dan is next
    const forDan = game.expectDecision('chooseCard', 'Alice');
    expect(forDan.cardChoices.map((choice) => choice.card.name)).toContain('Silver');
    expect(forDan.cardChoices).toHaveLength(6);
    await game.chooseCard('Silver');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.discard).toEqual(['Gold']);
    expect(cara.hand).toEqual(['Gold', 'Copper', 'Copper', 'Copper']);
    expect(cara.discard).toEqual([]);
    expect(dan.discard).toEqual(['Silver']);
    expect(dan.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).toEqual(['Spoils', 'Spoils']);
  });
});
