import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('AbandonedMine', () => {
  it('played twice by Throne Room gives +$2', async () => {
    const game = createGame({ kingdom: ['Throne Room', 'Death Cart'] });
    game.alice.setHand(['Throne Room', 'Abandoned Mine', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Abandoned Mine');

    expect(game.alice.coins).toBe(2);
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Abandoned Mine']);
  });

  it('is an Action card, so Death Cart can trash it from hand for +$5', async () => {
    const game = createGame({ kingdom: ['Death Cart'] });
    game.alice.setHand(['Death Cart', 'Abandoned Mine', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Death Cart');
    expect(game.pending.cardChoices.map((choice) => `${choice.card.name}@${choice.card.location}`).sort()).toEqual([
      `Abandoned Mine@${CardLocation.HAND}`,
      `Death Cart@${CardLocation.IN_PLAY}`,
    ]);
    await game.chooseCard('Abandoned Mine', CardLocation.HAND);

    expect(game.alice.coins).toBe(5);
    expect(game.trash).toEqual(['Abandoned Mine']);
    expect(game.alice.inPlay).toEqual(['Death Cart']);
  });
});
