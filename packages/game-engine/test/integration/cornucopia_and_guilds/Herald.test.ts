import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Alice plays all her Treasures, buys Herald and chooses how much to overpay.
const buyHerald = async (game: GameHarness, overpay: string): Promise<void> => {
  await game.start();
  await game.playAllTreasures();
  await game.buy('Herald');
  if (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect('Herald');
  }
  await game.chooseOption(overpay);
};

describe('Herald', () => {
  it('overpaying can put the bought Herald itself onto the deck', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await buyHerald(game, '$1');
    if (game.pending.kind === 'chooseCard' && game.pending.playerName === 'Alice') {
      await game.chooseCard('Herald');
    }

    // Herald was on top of the deck, so Clean-up draws it
    expect(game.alice.hand).toEqual(['Herald', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).not.toContain('Herald');
  });

  it('overpaying puts one chosen card from the discard pile onto the deck per $1', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.alice.setDiscard(['Silver', 'Estate', 'Duchy']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Herald');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Herald');
    }
    // $9 - $4 leaves at most $5 to overpay
    expect(game.pending.options).toContain('$5');
    expect(game.pending.options).not.toContain('$6');
    await game.chooseOption('$2');
    expect(game.pending.noneAllowed).toBe(false);
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');

    // The last card put on the deck is on top
    expect(game.alice.hand).toEqual(['Duchy', 'Silver', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).toContain('Estate');
  });

  it('with exactly $4 there is nothing to overpay, and no cards are moved', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(coppers(4));
    game.alice.setDeck(coppers(10));
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Herald');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Herald');
    }
    expect(game.pending.options).not.toContain('$1');
    await game.chooseOption(game.pending.options.includes('$0') ? '$0' : "Don't overpay");

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toEqual(coppers(5));
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Silver', 'Herald']));
  });

  it('overpaying more than the size of the discard pile puts the whole discard pile onto the deck', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.alice.setDiscard(['Estate']);

    await buyHerald(game, '$3');
    while (game.pending.kind === 'chooseCard' && game.pending.playerName === 'Alice') {
      await game.chooseCard(game.pending.cardChoices[0].card.name);
    }

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toContain('Estate');
    expect(game.alice.discard).not.toContain('Estate');
  });

  it('plays a revealed Attack so that other players can react to it', async () => {
    const game = createGame({ kingdom: ['Herald', 'Militia', 'Beggar'] });
    game.alice.setHand(['Herald', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Militia', ...coppers(10)]);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Herald');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toContain('Beggar');
  });

  it('shuffles to reveal a card when the deck runs out after drawing', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Herald', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Village']);

    await game.start();
    await game.playAction('Herald');

    expect(game.alice.inPlay).toEqual(['Herald', 'Village']);
    expect(game.alice.actions).toBe(3);
    expect(game.alice.hand).toEqual(coppers(5));
  });

  it('is discarded in Clean-up even when the Action it played is a Duration that stays in play', async () => {
    const game = createGame({ kingdom: ['Herald', 'Wharf'] });
    game.alice.setHand(['Herald', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Wharf', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Herald');
    expect(game.alice.inPlay).toEqual(['Herald', 'Wharf']);
    expect(game.alice.buys).toBe(2);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Wharf']);
    expect(game.alice.discard).toContain('Herald');
  });

  it('plays a revealed Coronet as an Action, which then plays an Action and a Treasure from hand twice', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Herald', 'Village', 'Silver', 'Estate']);
    game.alice.setDeck(['Copper', 'Coronet', ...coppers(10)]);

    await game.start();
    await game.playAction('Herald');
    await game.chooseCard('Village');
    await game.chooseCard('Silver');

    expect(game.alice.inPlay).toEqual(['Herald', 'Coronet', 'Village', 'Silver']);
    expect(game.alice.coins).toBe(4);
    // Herald's +1 Action and Village's +4 Actions; neither Coronet nor its plays used an Action
    expect(game.alice.actions).toBe(5);
    expect(game.alice.hand).toEqual(['Estate', 'Copper', 'Copper', 'Copper']);
  });

  it('overpaying with a Potion puts cards onto the deck only for the $ overpaid', async () => {
    const game = createGame({ kingdom: ['Herald', 'University'] });
    game.alice.setHand(['Potion', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.alice.setDiscard(['Silver', 'Estate']);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Herald');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Herald');
    }
    await game.chooseOption('$1P');
    await game.chooseCard('Silver');

    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.hand).toEqual(['Silver', 'Copper', 'Copper', 'Copper', 'Copper']);
  });

  it('plays a revealed Action–Victory card such as Mill', async () => {
    const game = createGame({ kingdom: ['Herald', 'Mill'] });
    game.alice.setHand(['Herald', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', 'Mill', 'Silver', ...coppers(5)]);

    await game.start();
    await game.playAction('Herald');
    // Mill: +1 Card, +1 Action, may discard 2 cards for +$2
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.alice.inPlay).toEqual(['Herald', 'Mill']);
    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.actions).toBe(2);
  });

  it('does not play a revealed Treasure–Victory card such as Farm, or a Curse, which stay on the deck', async () => {
    const game = createGame({ kingdom: ['Herald', 'Farm', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Herald']);
    game.alice.setDeck(['Copper', 'Farm']);
    game.alice.setDiscard(['Curse']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Herald');

    // First play: draws Copper and reveals Farm. Second play: draws Farm, shuffles and reveals Curse
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Herald']);
    expect(game.alice.hand).toEqual(['Copper', 'Farm']);
    expect(game.alice.deck).toEqual(['Curse']);
    expect(game.alice.actions).toBe(2);
  });

  it('plays a revealed Herald, which reveals the next card in turn', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Herald']);
    game.alice.setDeck(['Copper', 'Herald', 'Silver', 'Village', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Herald');

    // Herald draws Copper and plays Herald; that one draws Silver and plays Village, which draws Gold
    expect(game.alice.inPlay).toEqual(['Herald', 'Herald', 'Village']);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold']);
    expect(game.alice.actions).toBe(4);
  });

  it('with nothing left to reveal after drawing, only gives +1 Card and +1 Action', async () => {
    const game = createGame({ kingdom: ['Herald'] });
    game.alice.setHand(['Herald']);
    game.alice.setDeck(['Village']);

    await game.start();
    await game.playAction('Herald');

    expect(game.alice.inPlay).toEqual(['Herald']);
    expect(game.alice.hand).toEqual(['Village']);
    expect(game.alice.actions).toBe(1);
    game.expectDecision('actionPhase', 'Alice');
  });
});
