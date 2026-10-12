import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

/** Reveals the Diplomat that just resolved again, for the same Attack. */
const revealDiplomatAgain = async (game: GameHarness): Promise<void> => {
  game.expectDecision('chooseOneOption', 'Bob');
  await game.chooseOption('Reveal Diplomat again');
};

describe('Diplomat', () => {
  it('lets a player with 5 cards in hand reveal it to draw 2 then discard 3 before the Attack resolves', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Militia');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Diplomat']);
    await game.chooseEffect('Diplomat');
    // Drew Silver and Gold, then discards exactly 3 (which may include Diplomat)
    const discard = game.expectDecision('chooseCards', 'Bob');
    expect(discard.numSelectedEligibility).toEqual([3]);
    await game.chooseCards(['Diplomat', 'Estate', 'Estate']);
    // Bob now has 4 cards, so Diplomat can't be revealed again and Militia makes him discard 1
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }
    await game.chooseCards(['Copper']);

    expect([...game.bob.hand].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    expect([...game.bob.discard].sort()).toEqual(['Copper', 'Diplomat', 'Estate', 'Estate']);
  });

  it('cannot be revealed from a hand of fewer than 5 cards', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.bob.setHand(['Diplomat', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Militia');

    // No reaction prompt: straight to Militia's discard
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate']);
    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Copper']);
  });

  it('can be revealed again to the same Attack while the hand still has 5 or more cards', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', 'Gold', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    // 6 + 2 - 3 = 5 cards, Diplomat still among them
    await game.chooseCards(['Estate', 'Estate', 'Estate']);

    // Official FAQ: "If you still have at least 5 cards in hand after doing that ... you can reveal Diplomat again"
    await revealDiplomatAgain(game);
    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Copper', 'Silver', 'Silver', 'Gold', 'Gold']);
    await game.chooseCards(['Copper', 'Copper', 'Silver']);

    // 4 cards: Diplomat can't be revealed a third time, and Militia makes Bob discard 1
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Silver']);
    expect(game.bob.hand).toEqual(['Diplomat', 'Gold', 'Gold']);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('is not offered again once the hand has dropped below 5 cards, even though it is still in hand', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Estate', 'Estate', 'Estate']);

    // Straight to Militia's discard
    game.expectDecision('chooseCards', 'Bob');
    expect(game.pending.numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Copper']);
    expect(game.bob.hand).toEqual(['Diplomat', 'Silver', 'Gold']);
  });

  it('lets a second Diplomat drawn by the first be revealed to the same Attack', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Diplomat', 'Silver', 'Gold', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    // Discard the first Diplomat, keeping the one just drawn: 6 + 2 - 3 = 5 cards
    await game.chooseCards([game.bob.cards(CardLocation.HAND)[0], 'Estate', 'Estate']);

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Diplomat']);
    await game.chooseEffect('Diplomat');
    expect(game.bob.hand).toHaveLength(7);
    await game.chooseCards(['Copper', 'Copper', 'Copper']);

    await game.chooseCards(['Diplomat']);
    expect(game.bob.hand).toEqual(['Silver', 'Gold', 'Gold']);
    expect(game.bob.discard.filter((name) => name === 'Diplomat')).toHaveLength(2);
  });

  it('lets a Moat drawn by Diplomat be revealed to block the same Attack', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Moat', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Diplomat', 'Estate', 'Estate']);

    // Official FAQ: Moat can be revealed "even if the Moat was not in your hand until after resolving Diplomat"
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
    await game.chooseEffect('Moat');

    // Blocked: Bob keeps all 4 cards
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Moat', 'Silver']);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('can still be revealed after Moat, and Moat can still be revealed after it', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Moat', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Militia');
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect([...reaction.optionalEffects.map((effect) => effect.effectName)].sort()).toEqual(['Diplomat', 'Moat']);
    await game.chooseEffect('Moat');

    // Revealing Moat doesn't change the hand size, so Diplomat can still be revealed
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    expect([...game.bob.hand].sort()).toEqual(['Diplomat', 'Gold', 'Moat', 'Silver']);
    // Moat blocked Militia
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('is revealed against Minion before the attacker chooses, and 4 cards left makes the player unaffected', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Minion'] });
    game.alice.setHand(['Minion', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...coppers(10)]);

    await game.start();
    await game.playAction('Minion');

    // Official FAQ (Minion): players respond with Moat or Diplomat before the Minion player chooses
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Estate', 'Estate', 'Estate']);

    game.expectDecision('chooseOneOption', 'Alice');
    await game.chooseOption('Discard hand and draw 4 cards');

    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Silver', 'Gold']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate', 'Estate']);
  });

  it('lets a Tunnel discarded by the reaction be revealed to gain a Gold', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia', 'Tunnel'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Tunnel', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Diplomat', 'Tunnel', 'Estate']);
    await game.chooseEffect('Tunnel');

    expect([...game.bob.discard].sort()).toEqual(['Diplomat', 'Estate', 'Gold', 'Tunnel']);
    // 4 cards left: Militia makes Bob discard 1
    await game.chooseCards(['Copper']);
    expect(game.bob.hand).toEqual(['Copper', 'Silver', 'Silver']);
  });

  it('checks the hand size separately for each play by Throne Room', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Diplomat', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Diplomat');

    // First play: 4 cards in hand, +2 Actions; second play: 6 cards, no Actions
    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(2);
  });

  it('gives +2 Actions for both plays by Throne Room when the hand is exactly 5 after the second draw', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Diplomat', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Diplomat');

    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(4);
  });

  it('still discards 3 cards when revealed with nothing left to draw', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck([]);
    game.bob.setDiscard([]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    const discard = game.expectDecision('chooseCards', 'Bob');
    expect(discard.numSelectedEligibility).toEqual([3]);
    await game.chooseCards(['Estate', 'Estate', 'Estate']);

    // 2 cards left: Militia has nothing more to do
    expect(game.bob.hand).toEqual(['Diplomat', 'Copper']);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('shuffles the discard pile when revealed with an empty deck', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck([]);
    game.bob.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    expect(game.bob.hand).toEqual(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper', 'Gold']);
    await game.chooseCards(['Estate', 'Estate', 'Estate']);

    expect(game.bob.hand).toEqual(['Diplomat', 'Copper', 'Gold']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate', 'Estate']);
  });

  it('gives +2 Actions when a short deck leaves the hand at exactly 5 cards', async () => {
    const game = createGame({ kingdom: ['Diplomat'] });
    game.alice.setHand(['Diplomat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Diplomat');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(2);
  });

  it('lets each other player reveal their own Diplomat in turn order, with 3 players', async () => {
    const game = createGame({ kingdom: ['Diplomat', 'Militia'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Diplomat', 'Estate', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Silver', ...coppers(5)]);
    cara.setHand(['Diplomat', 'Curse', 'Curse', 'Curse', 'Copper']);
    cara.setDeck(['Gold', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Militia');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Estate', 'Estate', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Cara');
    await game.chooseEffect('Diplomat');
    await game.chooseCards(['Curse', 'Curse', 'Curse']);

    // Both have 4 cards left, so Militia makes each discard 1, in turn order
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Copper']);
    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Copper']);

    expect(game.bob.hand).toEqual(['Diplomat', 'Silver', 'Silver']);
    expect(cara.hand).toEqual(['Diplomat', 'Gold', 'Gold']);
  });
});
