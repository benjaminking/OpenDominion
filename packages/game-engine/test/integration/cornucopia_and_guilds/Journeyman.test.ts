import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Journeyman', () => {
  it('naming a card that is not in the deck puts the top 3 cards into hand', async () => {
    const game = createGame({ kingdom: ['Journeyman'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Copper', 'Silver', 'Estate', 'Gold']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Province');

    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate']);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.alice.discard).toEqual([]);
  });

  it('can name a card whose Supply pile is empty', async () => {
    const game = createGame({ kingdom: ['Journeyman'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Curse', 'Copper', 'Curse', 'Silver', 'Estate', 'Gold']);
    game.setPileSize('Curse', 0);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Curse');

    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate']);
    expect(game.alice.discard).toEqual(['Curse', 'Curse']);
  });

  it('shuffles the discard pile when the deck runs out, keeping the named cards out of the shuffle', async () => {
    const game = createGame({ kingdom: ['Journeyman'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Copper', 'Curse']);
    game.alice.setDiscard(['Silver', 'Gold']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Curse');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.discard).toEqual(['Curse']);
    expect(game.alice.deck).toEqual([]);
  });

  it('with fewer than 3 cards without that name even after shuffling, puts the ones it found into hand', async () => {
    const game = createGame({ kingdom: ['Journeyman'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Curse', 'Copper']);
    game.alice.setDiscard(['Curse', 'Silver']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Curse');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Silver']);
    expect(game.alice.discard).toEqual(['Curse', 'Curse']);
    expect(game.alice.deck).toEqual([]);
  });

  it('naming a card not in the deck at all, with a 2-card deck and empty discard pile, draws both', async () => {
    const game = createGame({ kingdom: ['Journeyman'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Copper', 'Estate']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Copper', 'Estate']);
    expect(game.alice.discard).toEqual([]);
  });

  it('a revealed Tunnel of the named card is discarded other than in Clean-up, so it can gain a Gold', async () => {
    const game = createGame({ kingdom: ['Journeyman', 'Tunnel'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Tunnel', 'Copper', 'Silver', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Tunnel');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate']);
    expect([...game.alice.discard].sort()).toEqual(['Gold', 'Tunnel']);
  });

  it('with no cards in the deck or discard pile, puts nothing into hand', async () => {
    const game = createGame({ kingdom: ['Journeyman'] });
    game.alice.setHand(['Journeyman']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Copper');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('naming one Ruins skips only that Ruins, not differently named ones', async () => {
    const game = createGame({ kingdom: ['Journeyman', 'Cultist'] });
    game.alice.setHand(['Journeyman']);
    game.alice.setDeck(['Ruined Library', 'Ruined Market', 'Ruined Library', 'Survivors', 'Copper', 'Gold']);

    await game.start();
    await game.playAction('Journeyman');
    await game.chooseCard('Ruined Library');

    expect(game.alice.hand).toEqual(['Ruined Market', 'Survivors', 'Copper']);
    expect(game.alice.discard).toEqual(['Ruined Library', 'Ruined Library']);
    expect(game.alice.deck).toEqual(['Gold']);
  });
});
