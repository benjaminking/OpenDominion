import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Familiar', () => {
  it('gives each other player a Curse in a 3-player game', async () => {
    const game = createGame({ kingdom: ['Familiar'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', ...copies('Copper', 10)]);
    const cursesBefore = game.pileSize('Curse');

    await game.start();
    await game.playAction('Familiar');

    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.actions).toBe(1);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual(['Curse']);
    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(cursesBefore - 2);
  });

  it('gives the last Curse to the next player in turn order when the pile runs out', async () => {
    const game = createGame({ kingdom: ['Familiar'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Familiar');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('still draws and gives +1 Action when the Curse pile is empty', async () => {
    const game = createGame({ kingdom: ['Familiar'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Familiar');

    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(1);
  });

  it('lets a player react with Guard Dog before gaining the Curse', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Guard Dog'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(['Guard Dog', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(copies('Silver', 10));

    await game.start();
    await game.playAction('Familiar');

    const reaction = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(reaction.optionalEffects.map((effect) => effect.effectName)).toEqual(['Guard Dog']);
    expect(game.bob.discard).toEqual([]);
    await game.chooseEffect('Guard Dog');
    if (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === 'Bob') {
      await game.declineEffects();
    }

    // Guard Dog doesn't block the Attack: Bob played it (+2 Cards) and still gains a Curse
    expect(game.bob.inPlay).toEqual(['Guard Dog']);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Silver', 'Silver']);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('gives each other player two Curses when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Familiar', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Familiar');

    expect(game.bob.discard).toEqual(['Curse', 'Curse']);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(2);
  });

  it('gives no Curse to a player who reveals Moat, but still gives one to the next player', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.player('Cara').setHand(['Moat', 'Estate', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Familiar');
    await game.chooseEffect('Moat');
    // Cara chooses not to reveal hers
    expect(game.pending.playerName).toBe('Cara');
    await game.declineEffects();

    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual(['Curse']);
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.actions).toBe(1);
  });

  it('gives no Curse to a player with a Lighthouse in play, even when Golem plays it', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Golem', 'Lighthouse', 'Festival'] });
    game.alice.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      'Golem',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Familiar',
      'Festival',
      ...copies('Estate', 10),
    ]);
    game.bob.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.endTurn();
    await game.playAction('Lighthouse');
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    await game.playAction('Golem');
    await game.chooseCard('Familiar');

    expect(game.alice.inPlay).toEqual(['Golem', 'Familiar', 'Festival']);
    expect(game.bob.discard).not.toContain('Curse');
    expect(game.pileSize('Curse')).toBe(10);
  });

  it("lets a player exchange the Curse for a Silver with Trader, after which Watchtower can't move the Curse", async () => {
    const game = createGame({ kingdom: ['Familiar', 'Trader', 'Watchtower'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(['Trader', 'Watchtower', 'Estate', 'Estate', 'Estate']);
    const cursesBefore = game.pileSize('Curse');

    await game.start();
    await game.playAction('Familiar');

    const decision = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(decision.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Trader', 'Watchtower']);
    await game.chooseEffect('Trader');
    // The Curse went back to its pile, so Watchtower is still offered but has lost track of it
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // Exchanging isn't gaining, so nothing is offered for the Silver
    expect(game.bob.log).toContain('Bob has lost track of Curse');
    expect(game.trash).toEqual([]);
    expect(game.pending.playerName).toBe('Alice');
    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.pileSize('Curse')).toBe(cursesBefore);
    expect(game.bob.hand).toEqual(['Trader', 'Watchtower', 'Estate', 'Estate', 'Estate']);
  });

  it('ends the game only after the turn when it gives out the last Curse as the third empty pile', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Village', 'Smithy'] });
    game.alice.setHand(['Familiar', 'Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Familiar');

    // The turn carries on: Alice still has the Action Familiar gave her
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.playAction('Village');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.isFinished).toBe(true);
    expect(game.alice.discard).toContain('Silver');
  });

  it('lets a player trash the Curse with Watchtower as they gain it', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Watchtower'] });
    game.alice.setHand(['Familiar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(['Watchtower', 'Estate', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Familiar');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Curse']);
    expect(game.bob.discard).toEqual([]);
    expect(game.bob.score).toBe(4);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('still gives the Curses when its owner has no cards left to draw', async () => {
    const game = createGame({ kingdom: ['Familiar', 'Village'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Familiar', 'Village', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Familiar');

    expect(game.alice.hand).toEqual(['Village', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.actions).toBe(1);
    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual(['Curse']);
  });
});
