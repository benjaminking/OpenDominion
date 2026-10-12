import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './baseGameHelpers';

describe('Poacher', () => {
  it('discards nothing when no Supply pile is empty', async () => {
    const game = createGame({ kingdom: ['Poacher'] });
    game.alice.setHand(['Poacher', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Poacher');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(5);
    expect(game.alice.coins).toBe(1);
  });

  it('counts empty basic Supply piles such as Curse, and discards after drawing', async () => {
    const game = createGame({ kingdom: ['Poacher'] });
    game.alice.setHand(['Poacher', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Poacher');
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(decision.numSelectedEligibility).toEqual([1]);
    // The card drawn by Poacher can be discarded
    expect(decision.cardChoices.map((choice) => choice.card.name)).toContain('Estate');
    await game.chooseCards(['Estate']);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('ignores empty non-Supply piles', async () => {
    const game = createGame({ kingdom: ['Poacher', 'Marauder'] });
    game.alice.setHand(['Poacher', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    expect(game.hasPile('Spoils')).toBe(true);
    game.setPileSize('Spoils', 0);

    await game.start();
    await game.playAction('Poacher');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(5);
  });

  it('discards the whole hand when it has fewer cards than there are empty Supply piles', async () => {
    const game = createGame({ kingdom: ['Poacher', 'Village'] });
    game.alice.setHand(['Poacher']);
    game.alice.setDeck(['Estate']);
    game.setPileSize('Curse', 0);
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('Poacher');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards(['Estate']);
    }

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.pending.kind).toBe('buyPhase');
  });

  it('discards nothing, without getting stuck, when the hand is empty', async () => {
    const game = createGame({ kingdom: ['Poacher'] });
    game.alice.setHand(['Poacher']);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Poacher');
    if (game.pending.kind === 'chooseCards') {
      await game.chooseCards([]);
    }

    expect(game.alice.coins).toBe(1);
    expect(game.pending.kind).toBe('buyPhase');
  });

  it('counts an empty Ruins pile, which is a Supply pile', async () => {
    const game = createGame({ kingdom: ['Poacher', 'Marauder'] });
    game.alice.setHand(['Poacher', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.setPileSize('Ruins', 0);

    await game.start();
    await game.playAction('Poacher');
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);

    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('counts an empty Knights pile', async () => {
    const game = createGame({ kingdom: ['Poacher', 'Knights'] });
    game.alice.setHand(['Poacher', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.setPileSize('Knights', 0);

    await game.start();
    await game.playAction('Poacher');
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);

    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('counts empty Platinum and Colony-game piles', async () => {
    const game = createGame({ kingdom: ['Poacher'], useColoniesPlatinum: true });
    game.alice.setHand(['Poacher', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.setPileSize('Platinum', 0);

    await game.start();
    await game.playAction('Poacher');
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);

    expect(game.alice.discard).toEqual(['Estate']);
  });

  it('counts a pile emptied earlier in the same turn', async () => {
    const game = createGame({ kingdom: ['Poacher', 'Workshop', 'Village'] });
    game.alice.setHand(['Village', 'Workshop', 'Poacher', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', ...coppers(10)]);
    game.setPileSize('Village', 1);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Workshop');
    await game.chooseCard('Village');
    expect(game.pileSize('Village')).toBe(0);
    await game.playAction('Poacher');
    expect(game.expectDecision('chooseCards', 'Alice').numSelectedEligibility).toEqual([1]);
    await game.chooseCards(['Estate']);

    expect(game.alice.discard.sort()).toEqual(['Estate', 'Village']);
  });

  it('triggers a "when discarded" reaction on a discarded card (Tunnel)', async () => {
    const game = createGame({ kingdom: ['Poacher', 'Tunnel'] });
    game.alice.setHand(['Poacher', 'Tunnel', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Poacher');
    await game.chooseCards(['Tunnel']);
    await game.chooseEffect('Tunnel');

    expect(game.alice.discard.sort()).toEqual(['Gold', 'Tunnel']);
  });
});
