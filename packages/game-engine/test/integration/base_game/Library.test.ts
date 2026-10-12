import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './baseGameHelpers';

const SET_ASIDE = 'Set it aside';
const DRAW = 'Draw it into your hand';

describe('Library', () => {
  it('lets each Action card be set aside or drawn, then discards the set-aside cards', async () => {
    const game = createGame({ kingdom: ['Library', 'Village', 'Smithy'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper', 'Smithy', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Library');
    expect(game.expectDecision('chooseOneOption', 'Alice').options.sort()).toEqual([DRAW, SET_ASIDE].sort());
    await game.chooseOption(SET_ASIDE);
    expect(game.alice.setAside).toEqual(['Village']);
    // The Copper is drawn without asking; Smithy is revealed next
    game.expectDecision('chooseOneOption', 'Alice');
    await game.chooseOption(DRAW);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Smithy', 'Silver']);
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard).toEqual(['Village']);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('does not shuffle the set-aside cards into the deck when it reshuffles mid-draw', async () => {
    const game = createGame({ kingdom: ['Library', 'Village'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Copper']);
    game.alice.setDiscard(['Silver', 'Silver', 'Silver']);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption(SET_ASIDE);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver']);
    expect(game.alice.deck).toEqual(['Silver']);
    expect(game.alice.discard).toEqual(['Village']);
  });

  it('stops when the deck and discard pile run out, still discarding the set-aside cards', async () => {
    const game = createGame({ kingdom: ['Library', 'Village', 'Smithy'] });
    game.alice.setHand(['Library', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Silver', 'Smithy']);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption(SET_ASIDE);
    await game.chooseOption(SET_ASIDE);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.setAside).toEqual([]);
    expect(game.alice.discard.sort()).toEqual(['Smithy', 'Village']);
  });

  it('draws nothing when the hand already has 7 cards', async () => {
    const game = createGame({ kingdom: ['Library', 'Village'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Gold']);

    await game.start();
    await game.playAction('Library');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toHaveLength(7);
    expect(game.alice.deck).toEqual(['Village', 'Gold']);
  });

  it('stops at 7 cards without looking at the next card, even when it is an Action', async () => {
    const game = createGame({ kingdom: ['Library', 'Village'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Village', 'Silver', 'Gold', 'Village', 'Copper']);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption(SET_ASIDE);

    // 4 + Silver, Silver, Gold = 7: the second Village is never revealed
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver', 'Gold']);
    expect(game.alice.deck).toEqual(['Village', 'Copper']);
    expect(game.alice.discard).toEqual(['Village']);
  });

  it('counts an Action card it chooses to draw toward the 7 cards', async () => {
    const game = createGame({ kingdom: ['Library', 'Village', 'Smithy'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Village', 'Smithy', 'Gold']);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption(DRAW);
    // 6 cards: Smithy is offered next
    await game.chooseOption(DRAW);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Village', 'Smithy']);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('may set aside an Action that is also another type (Moat, Nobles)', async () => {
    const game = createGame({ kingdom: ['Library', 'Moat', 'Nobles'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Moat', 'Nobles', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption(SET_ASIDE);
    await game.chooseOption(SET_ASIDE);

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.alice.discard.sort()).toEqual(['Moat', 'Nobles']);
  });

  it('draws a non-Action card with a reaction (Tunnel) without asking', async () => {
    const game = createGame({ kingdom: ['Library', 'Tunnel'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Tunnel', 'Gold', 'Silver']);

    await game.start();
    await game.playAction('Library');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Tunnel', 'Gold']);
  });

  it('discards the set-aside cards other than in Clean-up, so a set-aside Weaver may be played', async () => {
    const game = createGame({ kingdom: ['Library', 'Weaver'] });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Weaver', 'Gold', 'Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Library');
    await game.chooseOption(SET_ASIDE);
    // Weaver: when you discard this other than during Clean-up, you may play it
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');

    expect(game.alice.inPlay).toEqual(['Library', 'Weaver']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Gold', 'Silver']);
    expect(game.alice.discard).toEqual(['Silver', 'Silver']);
    expect(game.alice.setAside).toEqual([]);
  });

  it('draws nothing from a hand of 8 or more', async () => {
    const game = createGame({ kingdom: ['Library'] });
    game.alice.setHand(['Library', ...coppers(8)]);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Library');

    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('when played from the discard pile by Vassal, draws up to 7 from the cards left', async () => {
    const game = createGame({ kingdom: ['Library', 'Vassal'] });
    game.alice.setHand(['Vassal', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Library', 'Silver', 'Silver', 'Gold', 'Estate']);

    await game.start();
    await game.playAction('Vassal');
    await game.chooseOption('Yes');

    expect(game.alice.inPlay).toEqual(['Vassal', 'Library']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Silver', 'Gold']);
    expect(game.alice.deck).toEqual(['Estate']);
  });

  it('may skip any card that is an Action, whatever its other types, and draws other multi-type cards', async () => {
    const game = createGame({ kingdom: ['Library', 'Marauder', 'Farm', "Fool's Gold"], useShelters: true });
    game.alice.setHand(['Library', 'Copper', 'Copper', 'Copper', 'Copper']);
    // Coronet: Action-Treasure-Reward. Abandoned Mine: Action-Ruins. Necropolis: Action-Shelter.
    // Farm: Treasure-Victory. Fool's Gold: Treasure-Reaction. Hovel: Reaction-Shelter
    game.alice.setDeck(['Coronet', 'Abandoned Mine', 'Necropolis', 'Farm', "Fool's Gold", 'Hovel', 'Gold']);

    await game.start();
    await game.playAction('Library');
    for (const actionCard of ['Coronet', 'Abandoned Mine', 'Necropolis']) {
      expect(game.expectDecision('chooseOneOption', 'Alice').prompt).toContain(actionCard);
      await game.chooseOption(SET_ASIDE);
    }

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Farm', "Fool's Gold", 'Hovel']);
    expect(game.alice.discard.sort()).toEqual(['Abandoned Mine', 'Coronet', 'Necropolis']);
    expect(game.alice.deck).toEqual(['Gold']);
  });
});
