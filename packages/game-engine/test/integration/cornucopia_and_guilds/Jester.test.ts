import { CardInfoLookup } from '@dominion/card-info';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Jester', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('with 3 players, hits each other player in turn order', async () => {
    const game = createGame({ kingdom: ['Jester'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Estate', 'Copper']);
    game.player('Cara').setDeck(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Jester');
    // Bob discarded a Victory card, so he gains a Curse; Alice chooses who gains a copy of Cara's Silver
    expect(game.bob.discard).toEqual(['Estate', 'Curse']);
    game.expectDecision('chooseOneOption', 'Alice');
    expect(game.pending.options).toEqual(['You gain a copy', 'Cara gains a copy']);
    await game.chooseOption('Cara gains a copy');

    expect(game.player('Cara').discard).toEqual(['Silver', 'Silver']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.coins).toBe(2);
  });

  it('nobody gains a copy of a card with no copies left in the Supply', async () => {
    const game = createGame({ kingdom: ['Jester'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Gold']);
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Jester');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('You gain a copy');
    }

    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.alice.discard).toEqual([]);
  });

  it('a discarded Victory card gains nothing when the Curses have run out', async () => {
    const game = createGame({ kingdom: ['Jester'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Duchy']);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Jester');

    expect(game.bob.discard).toEqual(['Duchy']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it("shuffles the other player's discard pile when their deck is empty", async () => {
    const game = createGame({ kingdom: ['Jester'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Jester');
    await game.chooseOption('You gain a copy');

    expect(game.bob.discard).toEqual(['Silver']);
    expect(game.alice.discard).toEqual(['Silver']);
  });

  it('a discarded Action–Victory card counts as a Victory card, so the player gains a Curse', async () => {
    const game = createGame({ kingdom: ['Jester', 'Mill'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Mill', 'Copper']);

    await game.start();
    await game.playAction('Jester');

    expect(game.bob.discard).toEqual(['Mill', 'Curse']);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it("nobody gains a copy of a Reward, since Rewards aren't in the Supply", async () => {
    const game = createGame({ kingdom: ['Jester', 'Joust'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Courser', 'Copper']);
    const rewards = game.pileSize('Rewards');

    await game.start();
    await game.playAction('Jester');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('You gain a copy');
    }

    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Courser']);
    expect(game.pileSize('Rewards')).toBe(rewards);
  });

  it("nobody gains a copy of Spoils, since Spoils isn't in the Supply", async () => {
    const game = createGame({ kingdom: ['Jester', 'Bandit Camp'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Spoils', 'Copper']);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Jester');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('You gain a copy');
    }

    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Spoils')).toBe(spoils);
  });

  it("nobody gains a copy of a card from Ferryman's pile, since it isn't in the Supply", async () => {
    const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
    vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) =>
      requirements?.requiredCoinCosts?.join() === '3,4'
        ? 'Shop'
        : findMatchingRandomizerName(requirements, usedCardNames),
    );
    const game = createGame({ kingdom: ['Jester', 'Ferryman'] });
    vi.restoreAllMocks();
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Shop', 'Copper']);

    await game.start();
    await game.playAction('Jester');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('Bob gains a copy');
    }

    expect(game.bob.discard).toEqual(['Shop']);
    expect(game.pileSize('Shop')).toBe(10);
  });

  it('a copy of a Ruins can be gained when that Ruins is on top of the Ruins pile', async () => {
    const game = createGame({ kingdom: ['Jester', 'Cultist'] });
    game.setPile('Ruins', ['Ruined Village', 'Survivors']);
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Ruined Village', 'Copper']);

    await game.start();
    await game.playAction('Jester');
    await game.chooseOption('You gain a copy');

    expect(game.alice.discard).toEqual(['Ruined Village']);
    expect(game.pileCards('Ruins')).toEqual(['Survivors']);
  });

  it('nobody gains a copy of a Ruins that is not on top of the Ruins pile', async () => {
    const game = createGame({ kingdom: ['Jester', 'Cultist'] });
    game.setPile('Ruins', ['Survivors', 'Ruined Village']);
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Ruined Village', 'Copper']);

    await game.start();
    await game.playAction('Jester');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('You gain a copy');
    }

    expect(game.alice.discard).toEqual([]);
    expect(game.pileCards('Ruins')).toEqual(['Survivors', 'Ruined Village']);
  });

  it('a Farmhands copy gained by the other player lets them set aside a card, played at the start of their own turn', async () => {
    const game = createGame({ kingdom: ['Jester', 'Farmhands'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Village', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Farmhands', ...coppers(10)]);

    await game.start();
    await game.playAction('Jester');
    await game.chooseOption('Bob gains a copy');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Farmhands');
    }
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Village');
    expect(game.bob.setAside).toEqual(['Village']);
    await game.endTurn();

    // Bob's turn starts by playing the Village
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.setAside).toEqual([]);
    expect(game.bob.inPlay).toEqual(['Village']);
    expect(game.bob.actions).toBe(3);
    expect(game.bob.hand).toHaveLength(5);
  });

  it('a discarded Curse is not a Victory card, so the attacker chooses who gains a copy of the Curse', async () => {
    const game = createGame({ kingdom: ['Jester'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Curse', 'Copper']);
    const curses = game.pileSize('Curse');

    await game.start();
    await game.playAction('Jester');
    game.expectDecision('chooseOneOption', 'Alice');
    await game.chooseOption('Bob gains a copy');

    expect(game.bob.discard).toEqual(['Curse', 'Curse']);
    expect(game.pileSize('Curse')).toBe(curses - 1);
    expect(game.alice.discard).toEqual([]);
  });

  it('a discarded Treasure–Victory card (Farm) or Victory–Shelter (Overgrown Estate) gives a Curse', async () => {
    const game = createGame({ kingdom: ['Jester', 'Farm'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Farm', 'Copper']);
    game.player('Cara').setDeck(['Overgrown Estate', 'Copper']);

    await game.start();
    await game.playAction('Jester');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.discard).toEqual(['Farm', 'Curse']);
    expect(game.player('Cara').discard).toEqual(['Overgrown Estate', 'Curse']);
    expect(game.alice.discard).toEqual([]);
  });

  it('nobody gains a copy of a Knight that is not on top of the Knights pile', async () => {
    const game = createGame({ kingdom: ['Jester', 'Knights'] });
    game.setPile('Knights', ['Dame Anna', 'Sir Bailey']);
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Sir Martin', 'Copper']);

    await game.start();
    await game.playAction('Jester');
    if (game.pending.kind === 'chooseOneOption') {
      await game.chooseOption('You gain a copy');
    }

    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Sir Martin']);
    expect(game.pileCards('Knights')).toEqual(['Dame Anna', 'Sir Bailey']);
  });

  it('a discarded Tunnel can gain its owner a Gold, and as a Victory card it also gives a Curse', async () => {
    const game = createGame({ kingdom: ['Jester', 'Tunnel'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Tunnel', 'Copper']);

    await game.start();
    await game.playAction('Jester');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Tunnel');

    expect([...game.bob.discard].sort()).toEqual(['Curse', 'Gold', 'Tunnel']);
    game.expectDecision('treasurePhase', 'Alice');
  });
});
