import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const DISCARD_OPTION = 'Discard hand and draw 4 cards';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Minion', () => {
  it('makes only other players with at least 5 cards in hand discard their hands and draw 4', async () => {
    const game = createGame({ kingdom: ['Minion'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Minion', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Silver', ...Array<string>(6).fill('Copper')]);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Gold', 'Gold', 'Gold', 'Copper']);
    cara.setHand(['Estate', 'Estate', 'Copper', 'Copper']);
    cara.setDeck(['Gold', 'Gold', 'Gold', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption(DISCARD_OPTION);

    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.discard).toEqual(['Estate', 'Copper']);
    expect(game.bob.hand).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    expect(game.bob.discard).toHaveLength(5);
    expect(cara.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper']);
    expect(cara.discard).toEqual([]);
  });

  it('does not affect other players when +$2 is chosen', async () => {
    const game = createGame({ kingdom: ['Minion'] });
    game.alice.setHand(['Minion', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(Array<string>(5).fill('Gold'));

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption('+$2');

    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toHaveLength(4);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
  });

  it('still draws 4 cards when choosing to discard an empty hand', async () => {
    const game = createGame({ kingdom: ['Minion'] });
    game.alice.setHand(['Minion']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Silver', ...Array<string>(6).fill('Copper')]);

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption(DISCARD_OPTION);

    expect(game.alice.hand).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('checks the 5-card condition separately for each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Minion', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Minion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(12).fill('Copper'));
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck([...Array<string>(4).fill('Gold'), ...Array<string>(4).fill('Silver')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Minion');
    await game.chooseOption(DISCARD_OPTION);
    expect(game.bob.hand).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    await game.chooseOption(DISCARD_OPTION);

    // Bob only had 4 cards for the second play, so he keeps his Golds
    expect(game.bob.hand).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    expect(game.bob.deck).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.actions).toBe(2);
  });

  it('discards the hand before drawing, so a reshuffle for the 4 cards includes the discarded hand', async () => {
    const game = createGame({ kingdom: ['Minion'] });
    game.alice.setHand(['Minion', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver']);
    game.alice.setDiscard([]);

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption(DISCARD_OPTION);

    expect([...game.alice.hand].sort()).toEqual(['Estate', 'Estate', 'Silver', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('makes an attacked player with a short deck reshuffle their discarded hand to draw 4', async () => {
    const game = createGame({ kingdom: ['Minion'] });
    game.alice.setHand(['Minion', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Gold']);
    game.bob.setDiscard([]);

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption(DISCARD_OPTION);

    expect(game.bob.hand).toHaveLength(4);
    expect(game.bob.hand).toContain('Gold');
    expect(game.bob.hand.filter((name) => name === 'Estate')).toHaveLength(3);
    expect(game.bob.deck).toEqual(['Estate', 'Estate']);
    expect(game.bob.discard).toEqual([]);
  });

  it('lets Moat be revealed separately for each play by Throne Room, and each play may choose differently', async () => {
    const game = createGame({ kingdom: ['Minion', 'Throne Room', 'Moat'] });
    game.alice.setHand(['Throne Room', 'Minion', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(12));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Gold', 'Gold', 'Gold', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Minion');

    // First play: Bob reveals Moat, Alice takes +$2
    await game.chooseEffect('Moat');
    await game.chooseOption('+$2');
    expect(game.alice.coins).toBe(2);

    // Second play is a new Attack: Bob is offered Moat again and declines
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
    await game.declineEffects();
    await game.chooseOption(DISCARD_OPTION);

    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.actions).toBe(2);
    expect(game.bob.hand).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    expect([...game.bob.discard].sort()).toEqual(['Copper', 'Copper', 'Estate', 'Estate', 'Moat']);
  });

  it('protects a player who reveals Moat from the discard option, while others are still attacked', async () => {
    const game = createGame({ kingdom: ['Minion', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Minion', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Gold', 'Gold', 'Gold']);
    cara.setHand(['Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    cara.setDeck(['Silver', 'Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Minion');
    await game.chooseEffect('Moat');
    await game.chooseOption(DISCARD_OPTION);

    expect(game.bob.hand).toEqual(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    expect(cara.hand).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
  });

  it('lets an attacked player whose discarded hand includes a Tunnel reveal it to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Minion', 'Tunnel'] });
    game.alice.setHand(['Minion', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Tunnel', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', 'Silver', 'Silver', 'Copper']);

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption(DISCARD_OPTION);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Tunnel');

    expect(game.bob.hand).toEqual(['Silver', 'Silver', 'Silver', 'Silver']);
    expect(game.bob.discard).toContain('Gold');
    expect(game.bob.discard).toContain('Tunnel');
    expect(game.bob.discard).toHaveLength(6);
  });

  it('offers its options in the order printed on the card', async () => {
    const game = createGame({ kingdom: ['Minion'] });
    game.alice.setHand(['Minion', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Minion');

    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['+$2', DISCARD_OPTION]);
  });

  it('draws only what is left when the discarded hand, deck and discard pile hold fewer than 4 cards', async () => {
    const game = createGame({ kingdom: ['Minion'] });
    game.alice.setHand(['Minion', 'Estate']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Minion');
    await game.chooseOption(DISCARD_OPTION);

    expect([...game.alice.hand].sort()).toEqual(['Estate', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('in a 4-player game, attacks each other player with 5 or more cards in turn order, and each decides on Moat', async () => {
    const game = createGame({ kingdom: ['Minion', 'Moat'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Minion', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold', 'Gold', 'Gold', 'Gold']);
    cara.setHand(['Estate', 'Estate', 'Copper', 'Copper']);
    cara.setDeck(['Gold', 'Gold', 'Gold', 'Gold']);
    dan.setHand(['Moat', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    dan.setDeck(['Silver', 'Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Minion');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.declineEffects();
    game.expectDecision('chooseFromMultipleEvents', 'Dan');
    await game.chooseEffect('Moat');
    await game.chooseOption(DISCARD_OPTION);

    expect(game.bob.hand).toEqual(['Gold', 'Gold', 'Gold', 'Gold']);
    expect(cara.hand).toEqual(['Estate', 'Estate', 'Copper', 'Copper']);
    expect(dan.hand).toEqual(['Moat', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
  });
});
