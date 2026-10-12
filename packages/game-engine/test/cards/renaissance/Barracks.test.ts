import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Barracks } from '../../../src/cards/renaissance/Barracks';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createGame, GameHarness } from '../../integration/gameHarness';
import { createCardHarness } from '../testHarness';

// Renaissance is not registered in CardInfoLookup yet, so supply Barracks' card info directly
const barracksInfo: CardInfo = {
  name: 'Barracks',
  category: CardCategory.PROJECT,
  text: 'At the start of your turn,\n+1 Action .',
  font_size: 'large',
  cost: { coins: 6 },
  types: [],
  expansion: Expansion.RENAISSANCE,
  has_randomizer: false,
};
const lookUpRegisteredCardInfo = CardInfoLookup.lookUpCardInfo.bind(CardInfoLookup);
vi.spyOn(CardInfoLookup, 'lookUpCardInfo').mockImplementation((cardName: string) =>
  cardName === barracksInfo.name ? barracksInfo : lookUpRegisteredCardInfo(cardName),
);

// The engine doesn't set up Projects yet: give one player Barracks' ability, as if they had bought it
const giveBarracksTo = (game: GameHarness, playerName: string): void => {
  const barracks = new Barracks(game.state);
  for (const effect of barracks.getEffects()) {
    game.player(playerName).player.getEffects().addEffect(effect);
  }
};

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Barracks', () => {
  it('gives +1 Action at the start of your turn', async () => {
    const testHarness = createCardHarness();
    const barracks = new Barracks(testHarness.sharedGameState);

    const effects = barracks.getEffects();
    expect(effects).toHaveLength(1);
    expect(effects[0].getTrigger()).toBe(EffectTriggerType.TURN_START);
    expect(effects[0].getSource()).toBe(EffectSource.SELF);

    await effects[0].doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.stats.actions).toBe(1);
  });

  it('gives +1 Action on every turn', async () => {
    const testHarness = createCardHarness();
    const [turnStartEffect] = new Barracks(testHarness.sharedGameState).getEffects();

    await turnStartEffect.doAction(testHarness.executor, new EffectContextBuilder().build());
    await turnStartEffect.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(turnStartEffect.hasExpired()).toBe(false);
    expect(testHarness.stats.actions).toBe(2);
  });

  it('gives the +1 Action without giving the player a choice', () => {
    const testHarness = createCardHarness();
    const [turnStartEffect] = new Barracks(testHarness.sharedGameState).getEffects();

    expect(turnStartEffect.isMandatory()).toBe(true);
  });

  describe('in a game', () => {
    it("gives its owner +1 Action at the start of each of their turns, and nothing on other players' turns", async () => {
      const game = createGame({ kingdom: ['Village'], players: ['Alice', 'Bob', 'Cara'] });
      giveBarracksTo(game, 'Alice');
      for (const name of ['Alice', 'Bob', 'Cara']) {
        game.player(name).setHand(copies('Copper', 5));
        game.player(name).setDeck(copies('Copper', 10));
      }

      await game.start();
      expect(game.alice.actions).toBe(2);
      await game.endTurn();

      expect(game.currentPlayerName).toBe('Bob');
      expect(game.bob.actions).toBe(1);
      await game.endTurn();
      expect(game.currentPlayerName).toBe('Cara');
      expect(game.player('Cara').actions).toBe(1);
      await game.endTurn();

      expect(game.currentPlayerName).toBe('Alice');
      expect(game.alice.actions).toBe(2);
    });

    it('gives +1 Action at the start of an Outpost extra turn too', async () => {
      const game = createGame({ kingdom: ['Outpost', 'Village'] });
      giveBarracksTo(game, 'Alice');
      game.alice.setHand(['Outpost', 'Village', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(copies('Copper', 20));
      game.bob.setDeck(copies('Copper', 10));

      await game.start();
      // Outpost with the Action Barracks gave, then Village
      expect(game.alice.actions).toBe(2);
      await game.playAction('Outpost');
      await game.playAction('Village');
      await game.endTurn();
      await game.chooseExtraTurn('Outpost');

      // Barracks and Outpost both act at the start of the turn, in the order Alice chooses
      expect(game.currentPlayerName).toBe('Alice');
      expect(
        game
          .expectDecision('chooseFromMultipleEvents', 'Alice')
          .mandatoryEffects.map((effect) => effect.effectName)
          .sort(),
      ).toEqual(['Barracks', 'Outpost']);
      await game.chooseEffect('Barracks');

      expect(game.alice.hand).toHaveLength(3);
      expect(game.alice.actions).toBe(2);
    });

    it('gives each player who has it exactly +1 Action, only on their own turns', async () => {
      const game = createGame({ kingdom: ['Village'] });
      giveBarracksTo(game, 'Alice');
      giveBarracksTo(game, 'Bob');
      game.alice.setHand(copies('Copper', 5));
      game.alice.setDeck(copies('Copper', 10));
      game.bob.setHand(copies('Copper', 5));
      game.bob.setDeck(copies('Copper', 10));

      await game.start();
      expect(game.alice.actions).toBe(2);
      await game.endTurn();

      expect(game.currentPlayerName).toBe('Bob');
      expect(game.bob.actions).toBe(2);
      await game.endTurn();
      expect(game.alice.actions).toBe(2);
    });
  });
});
