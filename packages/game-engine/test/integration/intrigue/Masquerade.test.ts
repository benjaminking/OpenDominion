import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Masquerade', () => {
  it('moves each passed card out of the passing player hand and into the next player hand', async () => {
    const game = createGame({ kingdom: ['Masquerade'] });
    game.alice.setHand(['Masquerade', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', ...Array<string>(10).fill('Copper')]);
    game.bob.setHand(['Gold', 'Curse']);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Estate');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Curse');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Copper', 'Curse', 'Silver', 'Silver']);
    expect([...game.bob.hand].sort()).toEqual(['Estate', 'Gold']);

    // Then Alice may trash a card from her hand
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(true);
    await game.chooseCard('Curse');
    expect(game.trash).toEqual(['Curse']);
  });

  it('changes ownership of a passed Victory card for scoring', async () => {
    const game = createGame({ kingdom: ['Masquerade'] });
    game.alice.setHand(['Masquerade', 'Duchy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Copper', 'Copper']);

    await game.start();
    expect(game.alice.score).toBe(3);
    expect(game.bob.score).toBe(0);
    await game.playAction('Masquerade');
    await game.chooseCard('Duchy');
    // Cards are passed once every player has chosen
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Copper');

    expect(game.alice.score).toBe(0);
    expect(game.bob.score).toBe(3);
  });

  it('skips a player with no cards in hand: they neither pass nor receive', async () => {
    const game = createGame({ kingdom: ['Masquerade'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Masquerade', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...Array<string>(10).fill('Copper')]);
    game.bob.setHand([]);
    game.player('Cara').setHand(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Estate');
    // Bob has nothing to pass and is not asked; Cara passes to Alice and receives Alice's card
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Gold');

    expect(game.bob.hand).toEqual([]);
    expect([...game.player('Cara').hand].sort()).toEqual(['Estate', 'Gold']);
    expect(game.alice.hand.filter((name) => name === 'Gold')).toHaveLength(1);
    expect(game.alice.hand).not.toContain('Estate');
    expect(game.alice.hand).toHaveLength(6);
  });

  it('lets the only player with cards in hand pass a card to themself', async () => {
    const game = createGame({ kingdom: ['Masquerade'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Masquerade', 'Estate']);
    game.alice.setDeck(['Copper', 'Copper', ...Array<string>(10).fill('Copper')]);
    game.bob.setHand([]);
    game.player('Cara').setHand([]);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Estate');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Copper', 'Estate']);
    expect(game.bob.hand).toEqual([]);
    expect(game.player('Cara').hand).toEqual([]);
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(true);
  });

  it('moves a passed Curse, and its -1VP, to the next player', async () => {
    const game = createGame({ kingdom: ['Masquerade'] });
    game.alice.setHand(['Masquerade', 'Curse', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper']);

    await game.start();
    expect(game.alice.score).toBe(-1);
    expect(game.bob.score).toBe(1);
    await game.playAction('Masquerade');
    await game.chooseCard('Curse');
    await game.chooseCard('Copper');

    expect(game.alice.score).toBe(0);
    expect(game.bob.score).toBe(0);
    expect(game.bob.hand).toEqual(['Estate', 'Curse']);
  });

  it('passes all cards at once: a player cannot pass on the card they are about to receive', async () => {
    const game = createGame({ kingdom: ['Masquerade'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Masquerade', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate']);
    cara.setHand(['Curse', 'Silver']);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Gold');

    // Bob chooses from the cards he had: Alice's Gold is not in his hand yet
    const bobChoice = game.expectDecision('chooseCard', 'Bob');
    expect(bobChoice.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate', 'Estate']);
    await game.chooseCard('Estate');
    const caraChoice = game.expectDecision('chooseCard', 'Cara');
    expect([...caraChoice.cardChoices.map((choice) => choice.card.name)].sort()).toEqual(['Curse', 'Silver']);
    await game.chooseCard('Curse');

    expect([...game.bob.hand].sort()).toEqual(['Estate', 'Gold']);
    expect([...cara.hand].sort()).toEqual(['Estate', 'Silver']);
    expect(game.alice.hand).toContain('Curse');
    expect(game.alice.hand).not.toContain('Gold');
  });

  it('is not an Attack, so Moat cannot be revealed against it', async () => {
    const game = createGame({ kingdom: ['Masquerade', 'Moat'] });
    game.alice.setHand(['Masquerade', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Masquerade');

    // Straight to choosing cards to pass
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Estate');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Copper');
    expect(game.bob.hand).toContain('Estate');
  });

  it('is not gaining: the receiving player cannot react with Watchtower', async () => {
    const game = createGame({ kingdom: ['Masquerade', 'Watchtower'] });
    game.alice.setHand(['Masquerade', 'Curse', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Curse');
    await game.chooseCard('Copper');

    // No Watchtower prompt for Bob; Alice goes on to the optional trash
    game.expectDecision('chooseCard', 'Alice');
    expect(game.bob.hand).toEqual(['Watchtower', 'Copper', 'Curse']);
    expect(game.trash).toEqual([]);
  });

  it('lets a Moat received from the passing react to an Attack later in the same turn', async () => {
    const game = createGame({ kingdom: ['Masquerade', 'Moat', 'Militia'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Village', 'Masquerade', 'Militia', 'Moat', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Masquerade');
    await game.chooseCard('Moat');
    await game.chooseCard('Estate');
    // Cara passes her Moat to Alice
    await game.chooseCard('Moat');
    await game.chooseNone();

    await game.playAction('Militia');
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
    await game.chooseEffect('Moat');

    // Cara no longer has a Moat and must discard down to 3
    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Moat']);
    expect([...cara.hand].sort()).toEqual(['Copper', 'Copper', 'Estate']);
    expect(game.alice.hand).toContain('Moat');
  });

  it('lets the player trash the card they just received', async () => {
    const game = createGame({ kingdom: ['Masquerade'] });
    game.alice.setHand(['Masquerade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Gold']);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Copper');
    await game.chooseCard('Estate');

    const trashChoice = game.expectDecision('chooseCard', 'Alice');
    expect(trashChoice.cardChoices.map((choice) => choice.card.name)).toContain('Estate');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.score).toBe(0);
    expect(game.bob.score).toBe(0);
  });

  it('passes twice when played by Throne Room, each pass from the current hands', async () => {
    const game = createGame({ kingdom: ['Masquerade', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Masquerade', 'Estate', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', 'Silver', 'Silver', ...coppers(10)]);
    game.bob.setHand(['Gold', 'Curse']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Masquerade');
    await game.chooseCard('Estate');
    await game.chooseCard('Curse');
    await game.chooseNone();

    // Second play: Alice passes the Curse she just received, and Bob passes back the Estate
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Curse');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate');
    await game.chooseNone();

    expect([...game.bob.hand].sort()).toEqual(['Curse', 'Gold']);
    expect(game.alice.hand.filter((name) => name === 'Estate')).toHaveLength(1);
    expect(game.alice.hand).not.toContain('Curse');
    expect(game.alice.hand).toHaveLength(6);
  });

  it("moves a passed Watchtower's reaction to the receiving player", async () => {
    const game = createGame({ kingdom: ['Masquerade', 'Watchtower', 'Witch'] });
    game.alice.setHand(['Village', 'Masquerade', 'Witch', 'Watchtower', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Masquerade');
    await game.chooseCard('Watchtower');
    await game.chooseCard('Copper');
    await game.chooseNone();

    await game.playAction('Witch');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Curse']);
    expect(game.bob.discard).toEqual([]);
  });

  it('lets another player pass a card to themself when the player of Masquerade has no cards in hand', async () => {
    const game = createGame({ kingdom: ['Masquerade'] });
    game.alice.setHand(['Masquerade']);
    game.bob.setHand(['Estate', 'Gold']);

    await game.start();
    await game.playAction('Masquerade');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate');

    expect([...game.bob.hand].sort()).toEqual(['Estate', 'Gold']);
    expect(game.alice.hand).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('in a 4-player game, passes past a player with no cards and wraps around to the player of Masquerade', async () => {
    const game = createGame({ kingdom: ['Masquerade'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Masquerade', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Silver']);
    cara.setHand([]);
    dan.setHand(['Gold']);

    await game.start();
    await game.playAction('Masquerade');
    await game.chooseCard('Estate');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Silver');
    game.expectDecision('chooseCard', 'Dan');
    await game.chooseCard('Gold');

    expect(game.bob.hand).toEqual(['Estate']);
    expect(cara.hand).toEqual([]);
    expect(dan.hand).toEqual(['Silver']);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.hand).not.toContain('Estate');
  });

  it('draws only what is left when the deck and discard pile hold fewer than 2 cards, then passes as usual', async () => {
    const game = createGame({ kingdom: ['Masquerade'] });
    game.alice.setHand(['Masquerade', 'Estate']);
    game.alice.setDeck([]);
    game.alice.setDiscard(['Gold']);
    game.bob.setHand(['Copper']);

    await game.start();
    await game.playAction('Masquerade');
    expect([...game.alice.hand].sort()).toEqual(['Estate', 'Gold']);
    await game.chooseCard('Estate');
    await game.chooseCard('Copper');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Gold']);
    expect(game.bob.hand).toEqual(['Estate']);
  });
});
