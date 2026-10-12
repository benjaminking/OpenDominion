import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Clerk', () => {
  it('may be played at the start of your turn without using up your Action', async () => {
    const game = createGame({ kingdom: ['Clerk', 'Village'] });
    game.alice.setHand(['Clerk', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver']);

    await game.start();
    const startOfTurn = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(startOfTurn.optionalEffects.map((effect) => effect.effectName)).toEqual(['Clerk']);
    await game.chooseEffect('Clerk');
    await game.chooseCard('Estate');

    expect(game.bob.deck).toEqual(['Estate', 'Silver']);
    expect(game.alice.inPlay).toEqual(['Clerk']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
    expect(game.expectDecision('actionPhase', 'Alice').cardChoices.map((choice) => choice.card.name)).toEqual([
      'Village',
    ]);
  });

  it('lets you play several Clerks at the start of your turn, one at a time', async () => {
    const game = createGame({ kingdom: ['Clerk'] });
    game.alice.setHand(['Clerk', 'Clerk', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.chooseEffect('Clerk');
    await game.chooseCard('Estate');
    // The second Clerk is still offered; Bob now has 4 cards, so it doesn't affect him
    await game.chooseEffect('Clerk');

    expect(game.alice.inPlay).toEqual(['Clerk', 'Clerk']);
    expect(game.alice.coins).toBe(4);
    expect(game.alice.actions).toBe(1);
    expect(game.bob.hand).toHaveLength(4);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('is only offered at the start of the turn of the player holding it', async () => {
    const game = createGame({ kingdom: ['Clerk'] });
    game.alice.setHand(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Alice draws another Clerk in clean-up
    game.alice.setDeck(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.declineEffects();
    expect(game.alice.hand).toContain('Clerk');
    await game.endTurn();

    // Bob's turn starts without Alice being asked about her Clerk
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toContain('Clerk');
  });

  it('only affects other players with 5 or more cards in hand (3 players)', async () => {
    const game = createGame({ kingdom: ['Clerk'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    // Bob has no deck, so the card he puts back becomes his whole deck
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setHand(['Estate', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setDeck(coppers(5));

    await game.start();
    await game.declineEffects();
    await game.playAction('Clerk');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate');

    expect(game.bob.deck).toEqual(['Estate']);
    expect(game.bob.hand).toHaveLength(5);
    expect(game.player('Cara').hand).toHaveLength(4);
    expect(game.player('Cara').deck).toEqual(coppers(5));
    expect(game.pending.playerName).toBe('Alice');
  });

  it('lets other players react to it as an Attack when it is played from hand', async () => {
    const game = createGame({ kingdom: ['Clerk', 'Guard Dog'] });
    game.alice.setHand(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Guard Dog', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.declineEffects();
    await game.playAction('Clerk');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
  });

  it('lets other players react to it as an Attack when it is played at the start of the turn', async () => {
    const game = createGame({ kingdom: ['Clerk', 'Guard Dog'] });
    game.alice.setHand(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Guard Dog', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.chooseEffect('Clerk');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
  });

  it('can be blocked with Moat when it is played at the start of the turn', async () => {
    const game = createGame({ kingdom: ['Clerk', 'Moat'] });
    game.alice.setHand(['Clerk', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.chooseEffect('Clerk');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');
    if (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === 'Bob') {
      await game.declineEffects();
    }

    expect(game.bob.hand).toHaveLength(5);
    expect(game.bob.deck).toEqual(coppers(10));
    expect(game.alice.coins).toBe(2);
  });

  it('can be played at the start of the turn after Haven puts it into your hand', async () => {
    const game = createGame({ kingdom: ['Clerk', 'Haven'] });
    game.alice.setHand(['Haven', 'Clerk', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    // Don't play the Clerk now; set it aside with Haven instead
    await game.declineEffects();
    await game.playAction('Haven');
    await game.chooseCard('Clerk');
    await game.endTurn();
    await game.endTurn();

    // Start of Alice's turn: Haven puts the Clerk into her hand, and then the Clerk may be played
    expect(game.currentPlayerName).toBe('Alice');
    while (
      game.pending.kind === 'chooseFromMultipleEvents' &&
      !game.pending.optionalEffects.some((e) => e.effectName === 'Clerk')
    ) {
      await game.chooseEffect('Haven');
    }
    await game.chooseEffect('Clerk');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Copper');

    // Haven stays in play until this turn's clean-up
    expect(game.alice.inPlay).toEqual(['Haven', 'Clerk']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
  });

  it('lets you play a whole hand of Clerks at the start of the turn, leaving an empty hand', async () => {
    const game = createGame({ kingdom: ['Clerk'] });
    game.alice.setHand(['Clerk', 'Clerk', 'Clerk']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.chooseEffect('Clerk');
    await game.chooseCard('Estate');
    await game.chooseEffect('Clerk');
    await game.chooseEffect('Clerk');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Clerk', 'Clerk', 'Clerk']);
    expect(game.alice.coins).toBe(6);
    expect(game.alice.actions).toBe(1);
    expect(game.bob.deck[0]).toBe('Estate');
    // Nothing left to play: Alice goes straight on to buy with $6
    expect(game.expectDecision('buyPhase', 'Alice').numCoins).toBe(6);
    await game.buy('Gold');
    expect(game.alice.discard).toContain('Gold');
  });

  it('may be played at the start of an Outpost extra turn when it is in the 3-card hand', async () => {
    const game = createGame({ kingdom: ['Clerk', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Clerk', 'Copper', 'Copper', ...coppers(10)]);
    game.bob.setHand(['Estate', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Clerk', 'Copper', 'Copper']);
    const startOfTurn = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(startOfTurn.optionalEffects.map((effect) => effect.effectName)).toContain('Clerk');
    await game.chooseEffect('Clerk');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Estate');

    expect(game.bob.deck[0]).toBe('Estate');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(1);
  });
});
