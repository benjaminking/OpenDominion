import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const TRASH_FROM_SUPPLY = 'Trash an Action card from the Supply';
const GAIN_FROM_TRASH = 'Gain an Action card from the Trash';

describe('Lurker', () => {
  it('only offers Action cards when trashing from the Supply', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Village'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);

    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Copper');
    expect(offered).not.toContain('Estate');
    expect(offered).not.toContain('Province');
  });

  it('removes the trashed card from its Supply pile', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Village'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    const villagesBefore = game.pileSize('Village');

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Village');

    expect(game.trash).toEqual(['Village']);
    expect(game.pileSize('Village')).toBe(villagesBefore - 1);
    expect(game.alice.actions).toBe(1);
  });

  it('only offers Action cards when gaining from the trash, including Action-Victory cards', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Nobles'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.state.trash.addCard(game.bob.createCard('Estate', CardLocation.TRASH));
    game.state.trash.addCard(game.bob.createCard('Nobles', CardLocation.TRASH));
    game.state.trash.addCard(game.bob.createCard('Gold', CardLocation.TRASH));

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);

    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toEqual(['Nobles']);
    await game.chooseCard('Nobles');

    expect(game.alice.discard).toEqual(['Nobles']);
    expect(game.trash).toEqual(['Estate', 'Gold']);
  });

  it('gains nothing when the trash has no Action cards', async () => {
    const game = createGame({ kingdom: ['Lurker'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    game.state.trash.addCard(game.bob.createCard('Gold', CardLocation.TRASH));

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);

    expect(game.pending.kind).not.toBe('chooseCard');
    expect(game.alice.discard).toEqual([]);
    expect(game.trash).toEqual(['Gold']);
  });

  it('can trash an Action from the Supply and then gain it from the trash when played twice', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Lurker', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));
    const villagesBefore = game.pileSize('Village');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Village');
    await game.chooseOption(GAIN_FROM_TRASH);
    await game.chooseCard('Village');

    expect(game.alice.discard).toEqual(['Village']);
    expect(game.trash).toEqual([]);
    expect(game.pileSize('Village')).toBe(villagesBefore - 1);
    expect(game.alice.actions).toBe(2);
  });

  it('trashes only the top Knight, revealing the next one, and the trashed Knight resolves its when-trash ability', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Knights'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Knights', ['Sir Vander', 'Dame Anna', 'Sir Martin']);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);

    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Sir Vander');
    expect(offered).not.toContain('Dame Anna');
    await game.chooseCard('Sir Vander');

    expect(game.trash).toEqual(['Sir Vander']);
    expect(game.pileCards('Knights')).toEqual(['Dame Anna', 'Sir Martin']);
    // Rules clarification: trashing a card from the Supply activates its when-trash abilities
    expect(game.alice.discard).toEqual(['Gold']);
  });

  it('moves a Fortress trashed from the Supply into the player hand', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Fortress'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    const fortresses = game.pileSize('Fortress');

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Fortress');

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toContain('Fortress');
    expect(game.pileSize('Fortress')).toBe(fortresses - 1);
  });

  it('does not let Market Square react, since the card trashed from the Supply is not the player own', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Market Square', 'Village'] });
    game.alice.setHand(['Lurker', 'Market Square', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Village');

    expect(game.trash).toEqual(['Village']);
    expect(game.alice.hand).toContain('Market Square');
    game.expectDecision('actionPhase', 'Alice');
  });

  it('does not offer non-Supply Action cards (Madman, Mercenary) for trashing, but can gain one from the trash', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Hermit', 'Urchin'] });
    game.alice.setHand(['Lurker', 'Lurker', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setTrash(['Madman']);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Hermit');
    expect(offered).toContain('Urchin');
    expect(offered).not.toContain('Madman');
    expect(offered).not.toContain('Mercenary');
    await game.chooseCard('Hermit');

    await game.playAction('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);
    expect(
      [...game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name)].sort(),
    ).toEqual(['Hermit', 'Madman']);
    await game.chooseCard('Madman');
    expect(game.alice.discard).toEqual(['Madman']);
    expect(game.trash).toEqual(['Hermit']);
  });

  it('can empty a third Supply pile by trashing its last card, ending the game at the end of the turn', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 0);
    game.setPileSize('Village', 1);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Village');

    expect(game.pileSize('Village')).toBe(0);
    expect(game.isFinished).toBe(false);
    await game.endTurn();
    expect(game.isFinished).toBe(true);
  });

  it('lets each play choose differently when played by Throne Room (gain from the trash, then trash from the Supply)', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Lurker', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setTrash(['Smithy']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);
    await game.chooseCard('Smithy');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Village');

    expect(game.alice.discard).toEqual(['Smithy']);
    expect(game.trash).toEqual(['Village']);
    expect(game.alice.actions).toBe(2);
  });

  it('ends the game after the turn it empties a third pile, without taking an Outpost extra turn', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Outpost', 'Village', 'Smithy', 'Market'] });
    game.alice.setHand(['Outpost', 'Lurker', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Smithy', 0);
    game.setPileSize('Market', 0);
    game.setPileSize('Village', 1);
    game.alice.player.getStatistics().addActions(1);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);
    await game.chooseCard('Village');
    await game.playAction('Outpost');
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.gameResult).toBeDefined();
  });

  it('gains from the trash any card with the Action type, whatever its other types', async () => {
    const game = createGame({
      kingdom: ['Lurker', 'Joust', 'Knights', 'Cultist', "Fool's Gold", 'Moat'],
      useShelters: true,
    });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setTrash([
      'Necropolis',
      'Hovel',
      'Overgrown Estate',
      'Ruined Village',
      'Coronet',
      "Fool's Gold",
      'Dame Josephine',
      'Moat',
      'Tunnel',
    ]);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);

    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect([...offered].sort()).toEqual(['Coronet', 'Dame Josephine', 'Moat', 'Necropolis', 'Ruined Village']);
    await game.chooseCard('Coronet');
    expect(game.alice.discard).toEqual(['Coronet']);
  });

  it('can trash only the top Ruins card from the Supply', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Cultist'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPile('Ruins', ['Survivors', 'Ruined Library']);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);

    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Survivors');
    expect(offered).not.toContain('Ruined Library');
    await game.chooseCard('Survivors');
    expect(game.trash).toEqual(['Survivors']);
    expect(game.pileCards('Ruins')).toEqual(['Ruined Library']);
  });

  it('does not offer an Action card whose Supply pile is empty', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Village'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Village', 0);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(TRASH_FROM_SUPPLY);

    const offered = game.expectDecision('chooseCard', 'Alice').cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Lurker');
    expect(offered).not.toContain('Village');
  });

  it('resolves the when-gain ability of a card gained from the trash (Death Cart gains 2 Ruins)', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Death Cart'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.setTrash(['Death Cart']);
    game.setPile('Ruins', ['Survivors', 'Ruined Village', 'Ruined Market']);
    const deathCarts = game.pileSize('Death Cart');

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);
    await game.chooseCard('Death Cart');
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Death Cart');
    }

    expect([...game.alice.discard].sort()).toEqual(['Death Cart', 'Ruined Village', 'Survivors']);
    expect(game.trash).toEqual([]);
    expect(game.pileSize('Death Cart')).toBe(deathCarts);
  });

  it('lets a Trail gained from the trash be played by its when-gain ability', async () => {
    const game = createGame({ kingdom: ['Lurker', 'Trail'] });
    game.alice.setHand(['Lurker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    game.setTrash(['Trail']);

    await game.start();
    await game.playAction('Lurker');
    await game.chooseOption(GAIN_FROM_TRASH);
    await game.chooseCard('Trail');

    // Trail: "When you gain, trash, or discard this, other than in Clean-up, you may play it"
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trail');
    expect(game.alice.inPlay).toEqual(['Lurker', 'Trail']);
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.actions).toBe(2);
  });
});
