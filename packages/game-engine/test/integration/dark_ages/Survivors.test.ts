import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Survivors', () => {
  it('shuffles the discard pile to look at a second card, then can discard both', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Survivors', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Estate']);

    await game.start();
    await game.playAction('Survivors');
    const choice = game.expectDecision('chooseOneOption', 'Alice');
    expect(choice.options).toEqual(['Discard them', 'Put them back on top']);
    await game.chooseOption('Discard them');

    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper', 'Estate']);
  });

  it('shuffles the discard pile to look at a second card, then can put both back in any order', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Survivors', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper']);
    game.alice.setDiscard(['Estate']);

    await game.start();
    await game.playAction('Survivors');
    await game.chooseOption('Put them back on top');
    await game.chooseCard('Copper');

    expect(game.alice.deck).toEqual(['Estate', 'Copper']);
    expect(game.alice.discard).toEqual([]);
  });

  it('discarding the cards it looked at is a real discard, so a Tunnel among them can gain a Gold', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Tunnel'] });
    game.alice.setHand(['Survivors', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Estate', 'Silver']);

    await game.start();
    await game.playAction('Survivors');
    await game.chooseOption('Discard them');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    game.expectDecision('treasurePhase', 'Alice');
    expect([...game.alice.discard].sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(game.alice.deck).toEqual(['Silver']);
  });

  it('is played by Golem like any other Action, and looks at the cards after the ones Golem revealed', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck([
      'Survivors',
      'Copper',
      'Ruined Village',
      'Gold',
      'Silver',
      ...[1, 2, 3, 4, 5].map(() => 'Copper'),
    ]);

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Survivors');
    await game.chooseOption('Discard them');

    game.expectDecision(['actionPhase', 'treasurePhase'], 'Alice');
    expect(game.alice.inPlay).toEqual(['Golem', 'Survivors', 'Ruined Village']);
    expect([...game.alice.discard].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });
  it('looks at the only card left and can put it back without choosing an order', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Survivors', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Survivors');
    await game.chooseOption('Put them back on top');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.discard).toEqual([]);
  });

  it('can discard the only card left', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Survivors', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Survivors');
    await game.chooseOption('Discard them');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual(['Gold']);
  });
});
