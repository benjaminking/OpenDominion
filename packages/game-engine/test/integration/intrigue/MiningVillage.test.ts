import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('MiningVillage', () => {
  it('can only be trashed once for +$2 when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Mining Village', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Mining Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');
    expect(game.alice.coins).toBe(2);
    expect(game.trash).toEqual(['Mining Village']);

    // The second play still draws and gives Actions, but has lost track of itself, so trashing it does nothing
    await game.chooseOption('Yes');

    expect(game.alice.log).toContain('Alice has lost track of Mining Village');
    expect(game.alice.coins).toBe(2);
    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
  });

  it('cannot trash itself for +$2 when played from the Supply by Band of Misfits', async () => {
    const game = createGame({ kingdom: ['Mining Village', 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    const villages = game.pileSize('Mining Village');

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');

    // Official FAQ (Band of Misfits): the played card stays in the Supply; an effect trying to move it fails
    expect(game.alice.log).toContain('Alice has lost track of Mining Village');
    expect(game.trash).toEqual([]);
    expect(game.pileSize('Mining Village')).toBe(villages);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
  });

  it('lets Procession gain a card costing $1 more even after it trashed itself on the first play', async () => {
    const game = createGame({ kingdom: ['Mining Village', 'Procession', 'Market'] });
    game.alice.setHand(['Procession', 'Mining Village', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Procession');
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');
    await game.chooseOption('Yes');

    // Official FAQ (Procession): its gain is not conditional on the card being trashed
    expect(game.alice.log).toContain('Alice has lost track of Mining Village');
    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Market');
    await game.chooseCard('Market');
    expect(game.alice.discard).toEqual(['Market']);
  });

  it('can be trashed when played by Golem from the deck', async () => {
    const game = createGame({ kingdom: ['Mining Village', 'Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Mining Village', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Golem');
    await game.chooseOption('Yes');

    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.inPlay).toEqual(['Golem']);
    expect(game.alice.actions).toBe(2);
  });

  it('gives +$2 in the Buy phase when played by Coronet, but can only be trashed on the first play', async () => {
    const game = createGame({ kingdom: ['Mining Village'] });
    game.alice.setHand(['Coronet', 'Mining Village', 'Gold']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Coronet');
    await game.chooseCard('Mining Village');
    await game.chooseOption('Yes');
    await game.chooseOption('Yes');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseNone();
    }

    expect(game.alice.log).toContain('Alice has lost track of Mining Village');
    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.coins).toBe(2);
    expect(game.alice.hand).toEqual(['Gold', 'Copper', 'Copper']);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
  });

  it('still gives +2 Actions and can be trashed when there is no card to draw', async () => {
    const game = createGame({ kingdom: ['Mining Village'] });
    game.alice.setHand(['Mining Village', 'Copper']);

    await game.start();
    await game.playAction('Mining Village');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['Yes', 'No']);
    await game.chooseOption('Yes');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.coins).toBe(2);
    expect(game.trash).toEqual(['Mining Village']);
  });

  it('lets Market Square react when it trashes itself', async () => {
    const game = createGame({ kingdom: ['Mining Village', 'Market Square'] });
    game.alice.setHand(['Mining Village', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mining Village');
    await game.chooseOption('Yes');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Mining Village']);
    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    expect(game.alice.coins).toBe(2);
  });
});
