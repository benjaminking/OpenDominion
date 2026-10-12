import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Scavenger', () => {
  it('must put a card from the discard pile onto an empty deck', async () => {
    const game = createGame({ kingdom: ['Scavenger'] });
    game.alice.setHand(['Scavenger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Estate', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Scavenger');
    await game.chooseOption('No');

    const topdeck = game.expectDecision('chooseCard', 'Alice');
    expect(topdeck.noneAllowed).toBe(false);
    await game.chooseCard('Gold');

    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.discard).toEqual(['Estate', 'Copper']);
    expect(game.alice.coins).toBe(2);

    // Clean-up draws the Gold first, then shuffles for the rest
    await game.endTurn();
    expect(game.alice.hand).toContain('Gold');
  });

  it('only gives +$2 when both the deck and the discard pile are empty', async () => {
    const game = createGame({ kingdom: ['Scavenger'] });
    game.alice.setHand(['Scavenger', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Scavenger');
    await game.chooseOption('Yes');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.coins).toBe(2);
  });

  it('does not discard when it puts the deck into the discard pile, so a Tunnel in the deck gains nothing', async () => {
    const game = createGame({ kingdom: ['Scavenger', 'Tunnel'] });
    game.alice.setHand(['Scavenger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Silver', 'Gold']);
    game.alice.setDiscard(['Estate']);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Scavenger');
    await game.chooseOption('Yes');

    // Straight to choosing the card to put on the deck: no Tunnel prompt
    const topdeck = game.expectDecision('chooseCard', 'Alice');
    expect(topdeck.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Estate',
      'Gold',
      'Silver',
      'Tunnel',
    ]);
    await game.chooseCard('Gold');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.deck).toEqual(['Gold']);
    expect([...game.alice.discard].sort()).toEqual(['Estate', 'Silver', 'Tunnel']);
    expect(game.pileSize('Gold')).toBe(golds);
  });
});
