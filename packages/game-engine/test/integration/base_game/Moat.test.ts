import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

/** Reveals Moat for the pending Attack, then declines anything else the player is asked straight after. */
const revealMoat = async (game: GameHarness, playerName: string): Promise<void> => {
  const reaction = game.expectDecision('chooseFromMultipleEvents', playerName);
  expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
  await game.chooseEffect('Moat');
  if (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === playerName) {
    await game.declineEffects();
  }
};

describe('Moat', () => {
  it('blocks Witch: no Curse is gained, but the attacker still draws 2 cards', async () => {
    const game = createGame({ kingdom: ['Witch', 'Moat'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    const cursesBefore = game.pileSize('Curse');

    await game.start();
    await game.playAction('Witch');
    await revealMoat(game, 'Bob');

    expect(game.pileSize('Curse')).toBe(cursesBefore);
    expect(game.bob.discard).toEqual([]);
    expect(game.bob.hand).toContain('Moat');
    expect(game.alice.hand).toHaveLength(4 + 2);
  });

  it("blocks Bureaucrat's attack, but the attacker still gains a Silver onto their deck", async () => {
    const game = createGame({ kingdom: ['Bureaucrat', 'Moat'] });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Duchy', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Bureaucrat');
    await revealMoat(game, 'Bob');

    expect(game.pending.playerName).toBe('Alice');
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.bob.hand).toEqual(['Moat', 'Estate', 'Duchy', 'Copper', 'Copper']);
    expect(game.bob.deck).toEqual(['Gold']);
  });

  it('blocks Bandit: the target reveals nothing, but the attacker still gains a Gold', async () => {
    const game = createGame({ kingdom: ['Bandit', 'Moat'] });
    game.alice.setHand(['Bandit', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Bandit');
    await revealMoat(game, 'Bob');

    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.bob.deck).toEqual(['Silver', 'Gold', 'Copper']);
    expect(game.trash).toEqual([]);
  });

  it('protects only the player who reveals it in a 3-player game', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Militia');
    await revealMoat(game, 'Bob');

    // Cara has no Moat, so she discards down to 3
    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Estate', 'Estate']);

    expect(game.bob.hand).toHaveLength(5);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.coins).toBe(2);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('is optional: a player who declines to reveal it is attacked', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Militia');
    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Moat']);
    expect(reaction.mandatoryEffects).toEqual([]);
    await game.declineEffects();

    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.bob.hand).toEqual(['Moat', 'Copper', 'Copper']);
  });

  it('can be revealed again for a second Attack played the same turn', async () => {
    const game = createGame({ kingdom: ['Militia', 'Witch', 'Moat', 'Festival'] });
    game.alice.setHand(['Festival', 'Militia', 'Witch', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    const cursesBefore = game.pileSize('Curse');

    await game.start();
    await game.playAction('Festival');
    await game.playAction('Militia');
    await revealMoat(game, 'Bob');
    await game.playAction('Witch');
    await revealMoat(game, 'Bob');

    expect(game.bob.hand).toHaveLength(5);
    expect(game.pileSize('Curse')).toBe(cursesBefore);
  });

  it('is not offered when another player plays a non-Attack card that affects them', async () => {
    const game = createGame({ kingdom: ['Council Room', 'Moat'] });
    game.alice.setHand(['Council Room', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Council Room');

    // No reaction prompt: Bob just draws his card
    expect(game.pending.playerName).toBe('Alice');
    expect(game.bob.hand).toEqual(['Moat', 'Estate', 'Estate', 'Copper', 'Copper', 'Gold']);
  });
  it("doesn't stop the attacker's own later Duration effect (Sea Witch)", async () => {
    const game = createGame({ kingdom: ['Sea Witch', 'Moat'] });
    game.alice.setHand(['Sea Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Sea Witch');
    await revealMoat(game, 'Bob');
    expect(game.bob.discard).toEqual([]);
    await game.endTurn();
    await game.endTurn();

    // Alice's next turn: +2 Cards, then discard 2
    expect(game.currentPlayerName).toBe('Alice');
    await game.chooseCards(['Copper', 'Copper']);
    expect(game.alice.hand).toHaveLength(5);
  });
  it('is no longer offered once a Diplomat reaction has discarded it, so the Attack hits', async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat', 'Diplomat'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Moat', 'Diplomat', 'Estate', 'Estate', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playAction('Militia');
    await game.chooseEffect('Diplomat');
    // Diplomat: draws Silver and Gold, then Bob discards 3 cards, including his Moat
    await game.chooseCards(['Moat', 'Estate', 'Estate']);

    // Moat has left Bob's hand, so it can't be revealed: Militia makes him discard down to 3
    expect(game.pending.kind).not.toBe('chooseFromMultipleEvents');
    await game.chooseCards(['Copper']);
    expect(game.bob.hand.sort()).toEqual(['Diplomat', 'Gold', 'Silver']);
  });

  it('draws only the 1 card left when played with a 1-card deck and an empty discard pile', async () => {
    const game = createGame({ kingdom: ['Moat'] });
    game.alice.setHand(['Moat', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Moat');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Gold']);
    expect(game.alice.deck).toEqual([]);
  });

  it("is not offered against its owner's own Attack", async () => {
    const game = createGame({ kingdom: ['Militia', 'Moat'] });
    game.alice.setHand(['Militia', 'Moat', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Militia');

    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Moat', 'Copper', 'Copper', 'Copper']);
  });
});
