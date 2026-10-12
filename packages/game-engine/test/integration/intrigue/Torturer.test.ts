import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const DISCARD_OPTION = 'Discard 2 cards';
const CURSE_OPTION = 'Gain a Curse to your hand';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Torturer', () => {
  it('lets each other player choose in turn order, and the last Curse goes to the first player to take it', async () => {
    const game = createGame({ kingdom: ['Torturer'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Torturer');
    expect(game.alice.hand).toHaveLength(7);

    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption(CURSE_OPTION);
    // Cara may still pick the Curse option with no Curses left, and then gains nothing
    game.expectDecision('chooseOneOption', 'Cara');
    await game.chooseOption(CURSE_OPTION);

    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Curse']);
    expect(cara.hand).toHaveLength(5);
    expect(cara.hand).not.toContain('Curse');
    expect(game.pileSize('Curse')).toBe(0);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('makes a player who chooses to discard with only 1 card in hand discard that card', async () => {
    const game = createGame({ kingdom: ['Torturer'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Estate']);

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(DISCARD_OPTION);
    if (game.pending.kind === 'chooseCards' && game.pending.playerName === 'Bob') {
      await game.chooseCards(['Estate']);
    }

    expect(game.bob.hand).toEqual([]);
    expect(game.bob.discard).toEqual(['Estate']);
  });

  it('skips a player who reveals Moat, and the next player still chooses', async () => {
    const game = createGame({ kingdom: ['Torturer', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Torturer');
    // Each player decides on their own Moat, in turn order
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.declineEffects();

    game.expectDecision('chooseOneOption', 'Cara');
    await game.chooseOption(CURSE_OPTION);

    expect(game.bob.hand).toHaveLength(5);
    expect(game.bob.hand).not.toContain('Curse');
    expect(cara.hand).toContain('Curse');
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('lets a player with an empty hand choose to discard, which does nothing', async () => {
    const game = createGame({ kingdom: ['Torturer'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand([]);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(DISCARD_OPTION);
    if (game.pending.kind === 'chooseCards' && game.pending.playerName === 'Bob') {
      await game.chooseCards([]);
    }

    expect(game.bob.hand).toEqual([]);
    expect(game.bob.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(curses);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('attacks twice when played by Throne Room, and the player may choose differently each time', async () => {
    const game = createGame({ kingdom: ['Torturer', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Torturer', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Torturer');
    await game.chooseOption(CURSE_OPTION);
    expect(game.bob.hand).toContain('Curse');
    await game.chooseOption(DISCARD_OPTION);
    // The Curse gained to hand on the first play can be discarded on the second
    await game.chooseCards(['Curse', 'Estate']);

    expect(game.alice.hand).toHaveLength(9);
    expect([...game.bob.hand].sort()).toEqual(['Copper', 'Copper', 'Copper', 'Estate']);
    expect([...game.bob.discard].sort()).toEqual(['Curse', 'Estate']);
  });

  it('lets the player react to the Curse gained to hand with Watchtower', async () => {
    const game = createGame({ kingdom: ['Torturer', 'Watchtower'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(CURSE_OPTION);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.bob.hand).toEqual(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.bob.deck[0]).toBe('Curse');
  });

  it('lets a player who discards a Tunnel reveal it to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Torturer', 'Tunnel'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Tunnel', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(DISCARD_OPTION);
    await game.chooseCards(['Tunnel', 'Estate']);
    await game.chooseEffect('Tunnel');

    expect([...game.bob.discard].sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
  });

  it('lets the player exchange the Curse gained to hand for a Silver with Trader, which goes to the discard pile', async () => {
    const game = createGame({ kingdom: ['Torturer', 'Trader'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Trader', 'Copper', 'Copper', 'Copper', 'Copper']);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(CURSE_OPTION);
    await game.chooseEffect('Trader');

    // Official FAQ (Trader): return the gained card to its pile and put a Silver into the discard pile
    expect(game.bob.hand).toEqual(['Trader', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.pileSize('Curse')).toBe(curses);
  });

  it('offers the options in the order printed on the card', async () => {
    const game = createGame({ kingdom: ['Torturer'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Torturer');

    expect(game.expectDecision('chooseOneOption', 'Bob').options).toEqual([DISCARD_OPTION, CURSE_OPTION]);
  });

  it('draws only what is left when the deck and discard pile hold fewer than 3 cards', async () => {
    const game = createGame({ kingdom: ['Torturer'] });
    game.alice.setHand(['Torturer', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Torturer');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    game.expectDecision('chooseOneOption', 'Bob');
  });

  it('in a 4-player game, the other players choose in turn order and the Curses run out partway', async () => {
    const game = createGame({ kingdom: ['Torturer'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper']);
    cara.setHand(['Copper', 'Copper', 'Copper']);
    dan.setHand(['Copper', 'Copper', 'Copper']);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Torturer');
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption(DISCARD_OPTION);
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseOneOption', 'Cara');
    await game.chooseOption(CURSE_OPTION);
    game.expectDecision('chooseOneOption', 'Dan');
    await game.chooseOption(CURSE_OPTION);

    expect(game.bob.hand).toEqual(['Copper']);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Copper', 'Curse']);
    expect(dan.hand).toEqual(['Copper', 'Copper', 'Copper']);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('can give out the last Curse as the third empty Supply pile, ending the game after the turn', async () => {
    const game = createGame({ kingdom: ['Torturer', 'Village', 'Smithy'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(CURSE_OPTION);

    expect(game.pileSize('Curse')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it("lets an attacked player play a discarded Weaver during the attacker's turn", async () => {
    const game = createGame({ kingdom: ['Torturer', 'Weaver'] });
    game.alice.setHand(['Torturer', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Torturer');
    await game.chooseOption(DISCARD_OPTION);
    await game.chooseCards(['Weaver', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    expect(game.bob.inPlay).toEqual(['Weaver']);
    expect([...game.bob.discard].sort()).toEqual(['Estate', 'Silver', 'Silver']);
    expect(game.currentPlayerName).toBe('Alice');
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });
});
