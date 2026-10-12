import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Watchtower', () => {
  it('can trash a card you buy', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    expect(reaction.mandatoryEffects).toEqual([]);
    await game.chooseEffect('Watchtower');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['Trash it', 'Put it onto your deck']);
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Silver']);
    expect([...game.alice.hand, ...game.alice.deck, ...game.alice.discard]).not.toContain('Silver');
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('can put a card you buy onto your deck, so you draw it in clean-up', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Gold');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.hand).toEqual(['Gold', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard.filter((name) => name === 'Gold')).toHaveLength(2);
  });

  it('can be declined, leaving the gained card in the discard pile', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.declineEffects();

    expect(game.trash).toEqual([]);
    expect(game.alice.discard).toContain('Silver');
    expect(game.alice.deck).toEqual(coppers(5));
  });

  it('is not offered once it has been played', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Watchtower');
    // Draws until 6 cards in hand
    expect(game.alice.hand).toHaveLength(6);
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toContain('Silver');
  });

  it("reacts to cards gained on another player's turn: one player trashes, another topdecks (3 players)", async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Charlatan'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Charlatan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));
    cara.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(coppers(5));
    const curseName = game.state.piles.getTopCardOfPile('Curse')!.getName();

    await game.start();
    await game.playAction('Charlatan');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.trash).toEqual([curseName]);
    expect(game.bob.discard).toEqual([]);
    expect(cara.deck[0]).toBe(curseName);
    expect(cara.discard).toEqual([]);
    expect(cara.hand).toContain('Watchtower');
    expect(game.pending.playerName).toBe('Alice');
  });

  it('can put a card gained into your hand onto your deck', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Mine'] });
    game.alice.setHand(['Mine', 'Watchtower', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mine');
    await game.chooseCard('Copper');
    await game.chooseCard('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.hand).toEqual(['Watchtower', 'Estate', 'Estate']);
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.trash).toEqual(['Copper']);
  });

  it('is a separate decision for each gained card, e.g. the Gold from Hoard', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Hoard'] });
    game.alice.setHand(['Watchtower', 'Hoard', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    await game.buy('Duchy');
    const duchyReaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(duchyReaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    expect(duchyReaction.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Hoard']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // Hoard still gains a Gold for the bought Duchy, and Watchtower is offered again for it
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.trash).toEqual(['Duchy']);
    expect(game.alice.hand[0]).toBe('Gold');
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('can put a gained Mint onto your deck as well as Mint trashing your Treasures', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Mint'] });
    game.alice.setHand(['Watchtower', 'Silver', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Mint');
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    expect(reaction.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Mint']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect([...game.trash].sort()).toEqual(['Copper', 'Silver', 'Silver']);
    expect(game.alice.hand[0]).toBe('Mint');
  });

  it('still offers a second Watchtower once the first has trashed the gained card, but it has lost track of it', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.expectDecision('chooseFromMultipleEvents', 'Alice').optionalEffects).toHaveLength(2);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // The second Watchtower is still offered, but the Silver has left the discard pile
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.hand).toEqual(coppers(5));
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
  });

  it('still offers a second Watchtower once the first has put the gained card onto the deck, but it has lost track of it', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');
    // The Silver has moved since it was gained (even though it was gained to the discard pile and is now on the
    // deck), so the second Watchtower has lost track of it and can't trash it
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // The turn ends and Alice draws the Silver in clean-up
    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Silver', 'Copper', 'Copper', 'Copper', 'Copper']);
  });

  it('trashing a gained Rats triggers its "when you trash this" +1 Card before Rats finishes', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Rats'] });
    game.alice.setHand(['Rats', 'Watchtower', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const ratsBefore = game.pileSize('Rats');

    await game.start();
    await game.playAction('Rats');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // The trashed Rats draws the Gold; then Rats makes Alice trash a non-Rats card
    expect(game.alice.hand).toContain('Gold');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Rats', 'Estate']);
    expect(game.pileSize('Rats')).toBe(ratsBefore - 1);
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Gold', 'Silver', 'Watchtower']);
  });

  it("lets a player with an empty deck put the Curses from another player's Throne Roomed Witch onto it, one by one", async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Witch', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDiscard(['Silver', 'Silver', 'Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Witch');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');
    // The Curse is now Bob's whole deck; the second Witch play gives him another
    expect(game.bob.deck).toEqual(['Curse']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.bob.deck).toEqual(['Curse', 'Curse']);
    expect(game.bob.discard).toEqual(['Silver', 'Silver', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.hand).toHaveLength(7);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('can put a gained card onto an empty deck, so it is drawn before the discard pile is shuffled', async () => {
    const game = createGame({ kingdom: ['Watchtower'] });
    game.alice.setHand(['Watchtower', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.alice.setDiscard(coppers(6));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    // Clean-up draws the Silver, then shuffles the discard pile (which has no other Silver) for 4 more cards
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.hand[0]).toBe('Silver');
    expect(game.alice.hand.filter((name) => name === 'Silver')).toHaveLength(1);
    expect(game.alice.hand.length + game.alice.deck.length + game.alice.discard.length).toBe(12);
  });

  it('has lost track of a card that Trader has already exchanged, and is not offered for the Silver', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Trader'] });
    game.alice.setHand(['Watchtower', 'Trader', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Duchy');
    expect(
      game
        .expectDecision('chooseFromMultipleEvents', 'Alice')
        .optionalEffects.map((effect) => effect.effectName)
        .sort(),
    ).toEqual(['Trader', 'Watchtower']);
    await game.chooseEffect('Trader');
    // The Duchy is back in its pile: Watchtower is still offered, but has lost track of it
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // The Silver wasn't gained, so there is nothing left to react to
    expect(game.alice.log).toContain('Alice has lost track of Duchy');
    expect(game.pileSize('Duchy')).toBe(8);
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toContain('Silver');
    expect(game.alice.discard).not.toContain('Duchy');
    expect(game.trash).toEqual([]);
  });

  it('stops Trader from exchanging a gained card that Watchtower has already trashed', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Trader'] });
    game.alice.setHand(['Watchtower', 'Trader', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Duchy');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // Trader is still offered, but has lost track of the trashed Duchy
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trader');

    expect(game.alice.log).toContain('Alice has lost track of Duchy');
    expect(game.trash).toEqual(['Duchy']);
    expect(game.pileSize('Duchy')).toBe(7);
    expect([...game.alice.hand, ...game.alice.deck, ...game.alice.discard]).not.toContain('Silver');
  });

  it('trashes a gained card that Tiara then can no longer put onto your deck', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Tiara'] });
    game.alice.setHand(['Watchtower', 'Tiara', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Tiara');
    await game.chooseNone();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // The Silver is in the trash, so Tiara is still offered but has lost track of it
    await game.chooseEffect('Tiara');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.expectDecision('buyPhase', 'Alice').numBuys).toBe(1);
    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.deck).not.toContain('Silver');
  });

  it('has lost track of a card that Tiara has already put onto your deck', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Tiara'] });
    game.alice.setHand(['Watchtower', 'Tiara', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Tiara');
    await game.chooseNone();
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.chooseEffect('Tiara');
    // The Silver has moved from where it was gained, so Watchtower is still offered but can no longer trash it
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.expectDecision('buyPhase', 'Alice').numBuys).toBe(1);
    expect(game.alice.deck[0]).toBe('Silver');
    await game.endBuyPhase();
    expect(game.trash).toEqual([]);
    expect(game.alice.hand[0]).toBe('Silver');
  });

  it('gained into your hand by Artisan, can react to its own gain and put itself onto your deck', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Artisan'] });
    game.alice.setHand(['Artisan', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Watchtower');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');
    expect(game.alice.deck[0]).toBe('Watchtower');
    // Artisan then puts a card from hand onto the deck, on top of the Watchtower
    await game.chooseCard('Estate');

    expect(game.alice.deck.slice(0, 2)).toEqual(['Estate', 'Watchtower']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper']);
  });

  it('offers the reaction of a Watchtower gained into your hand only once', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Artisan'] });
    game.alice.setHand(['Artisan', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Artisan');
    await game.chooseCard('Watchtower');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
  });

  it("played by King's Court, draws up to 6 on the first play and nothing on the others", async () => {
    const game = createGame({ kingdom: ['Watchtower', "King's Court"] });
    game.alice.setHand(["King's Court", 'Watchtower', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Watchtower');

    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.deck).toHaveLength(6);
  });

  it("can trash a card gained onto the deck, e.g. Bureaucrat's Silver", async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Bureaucrat'] });
    game.alice.setHand(['Bureaucrat', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Bureaucrat');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.deck[0]).toBe('Gold');
  });

  it('can react again to the Gold that Market Square gains when Watchtower trashes a gained card', async () => {
    const game = createGame({ kingdom: ['Watchtower', 'Market Square'] });
    game.alice.setHand(['Watchtower', 'Market Square', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Estate');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // The trashed Estate was one of Alice's cards
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.discard).not.toContain('Gold');
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.hand[0]).toBe('Gold');
  });
});
