import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Vineyard } from '../../../src/cards/alchemy/Vineyard';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Province } from '../../../src/cards/basic_cards/Province';
import { DameJosephine } from '../../../src/cards/dark_ages/DameJosephine';
import { Battlefield } from '../../../src/cards/empires/Battlefield';
import { Tunnel } from '../../../src/cards/hinterlands/Tunnel';
import { Farm } from '../../../src/cards/intrigue/Farm';
import { Mill } from '../../../src/cards/intrigue/Mill';
import { Nobles } from '../../../src/cards/intrigue/Nobles';
import { Effect } from '../../../src/effects/Effect';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createGame, GameHarness } from '../../integration/gameHarness';
import { createCardHarness } from '../testHarness';

// Empires is not registered in CardInfoLookup yet, so supply Battlefield's card info directly
const battlefieldInfo: CardInfo = {
  name: 'Battlefield',
  category: CardCategory.LANDMARK,
  text: 'When you gain a Victory card, take 2 from here.',
  font_size: 'large',
  cost: { coins: 0 },
  types: [],
  expansion: Expansion.EMPIRES,
  has_randomizer: false,
};
const lookUpRegisteredCardInfo = CardInfoLookup.lookUpCardInfo.bind(CardInfoLookup);
vi.spyOn(CardInfoLookup, 'lookUpCardInfo').mockImplementation((cardName: string) =>
  cardName === battlefieldInfo.name ? battlefieldInfo : lookUpRegisteredCardInfo(cardName),
);

const getGainEffect = (battlefield: Battlefield): Effect => {
  const gainEffects = battlefield.getEffects().filter((effect) => effect.getTrigger() === EffectTriggerType.GAIN);
  expect(gainEffects).toHaveLength(1);
  return gainEffects[0];
};

// The engine doesn't set up Landmarks yet: give every player Battlefield's ability, as a Landmark in the game would
const addBattlefieldToGame = (game: GameHarness): Battlefield => {
  const battlefield = new Battlefield(game.state);
  for (const effect of battlefield.getEffects()) {
    game.state.addGlobalEffect(effect);
  }
  return battlefield;
};

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('Battlefield', () => {
  it('gives 2 VP when you gain a Victory card', async () => {
    const testHarness = createCardHarness();
    const battlefield = new Battlefield(testHarness.sharedGameState);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-gained');
    testHarness.addToDiscard(estate);

    const gainEffect = getGainEffect(battlefield);
    expect(gainEffect.getSource()).toBe(EffectSource.SELF);
    await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(estate).withGainLocation(estate.getLocation()).build());

    expect(testHarness.stats.vp).toBe(2);
  });

  it('only triggers on gaining Victory cards', () => {
    const testHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-0');
    const province = new Province(testHarness.sharedGameState);
    province.setId('province-0');
    const vineyard = new Vineyard(testHarness.sharedGameState);
    vineyard.setId('vineyard-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-0');
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-0');
    const curse = new Curse(testHarness.sharedGameState);
    curse.setId('curse-0');

    expect(gainEffect.getCardEligibility().matches(estate)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(province)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(vineyard)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(copper)).toBe(false);
    expect(gainEffect.getCardEligibility().matches(village)).toBe(false);
    expect(gainEffect.getCardEligibility().matches(curse)).toBe(false);
  });

  it('starts with 6 VP per player and stops giving VP once empty', async () => {
    const testHarness = createCardHarness();
    // the harness reports 2 players
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    for (let i = 0; i < 7; i++) {
      const estate = new Estate(testHarness.sharedGameState);
      estate.setId(`estate-gained-${String(i)}`);
      await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(estate).withGainLocation(estate.getLocation()).build());
    }

    expect(testHarness.stats.vp).toBe(12);
  });

  it('scales its starting VP with the number of players', async () => {
    const testHarness = createCardHarness();
    vi.mocked(testHarness.sharedGameState.getNumPlayers).mockReturnValue(3);
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    for (let i = 0; i < 10; i++) {
      const estate = new Estate(testHarness.sharedGameState);
      estate.setId(`estate-gained-${String(i)}`);
      await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(estate).withGainLocation(estate.getLocation()).build());
    }

    expect(testHarness.stats.vp).toBe(18);
  });

  it('shares its VP between players', async () => {
    const testHarness = createCardHarness();
    const otherHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    for (let i = 0; i < 4; i++) {
      const estate = new Estate(testHarness.sharedGameState);
      estate.setId(`estate-gained-${String(i)}`);
      await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(estate).withGainLocation(estate.getLocation()).build());
    }
    for (let i = 0; i < 3; i++) {
      const otherEstate = new Estate(otherHarness.sharedGameState);
      otherEstate.setId(`estate-other-gained-${String(i)}`);
      await gainEffect.doAction(
        otherHarness.executor,
        new EffectContextBuilder().withTargetCard(otherEstate).withGainLocation(otherEstate.getLocation()).build(),
      );
    }

    expect(testHarness.stats.vp).toBe(8);
    expect(otherHarness.stats.vp).toBe(4);
  });

  it('is not worth VP itself at the end of the game', () => {
    const testHarness = createCardHarness();
    const battlefield = new Battlefield(testHarness.sharedGameState);

    expect(battlefield.score([])).toBe(0);
  });

  it('triggers on gaining an Action-Victory card', async () => {
    const testHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));
    const mill = new Mill(testHarness.sharedGameState);
    mill.setId('mill-gained');
    testHarness.addToDiscard(mill);

    expect(gainEffect.getCardEligibility().matches(mill)).toBe(true);
    await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(mill).withGainLocation(mill.getLocation()).build());

    expect(testHarness.stats.vp).toBe(2);
  });

  it('takes the VP without giving the player a choice', () => {
    const testHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    expect(gainEffect.isMandatory()).toBe(true);
  });

  it('triggers on Victory cards of every type combination: Farm, Dame Josephine, Tunnel and Nobles', () => {
    const testHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    const cards = [
      new Farm(testHarness.sharedGameState),
      new DameJosephine(testHarness.sharedGameState),
      new Tunnel(testHarness.sharedGameState),
      new Nobles(testHarness.sharedGameState),
    ];
    for (const card of cards) {
      card.setId(`${card.getClassName()}-gained`);
      expect(gainEffect.getCardEligibility().matches(card)).toBe(true);
    }
  });

  describe('in a game', () => {
    it("gives the VP to the player who gains the Victory card, even on another player's turn", async () => {
      const game = createGame({ kingdom: ['Swindler'] });
      addBattlefieldToGame(game);
      game.alice.setHand(['Swindler', 'Silver', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(copies('Copper', 10));
      game.bob.setDeck(['Estate', ...copies('Copper', 5)]);

      await game.start();
      await game.playAction('Swindler');
      // Bob's Estate is trashed and Alice chooses the $2 card he gains
      await game.chooseCard('Estate');

      expect(game.bob.discard).toEqual(['Estate']);
      expect(game.bob.vpTokens).toBe(2);
      expect(game.alice.vpTokens).toBe(0);

      await game.playAllTreasures();
      await game.buy('Estate');
      expect(game.alice.vpTokens).toBe(2);
      expect(game.bob.vpTokens).toBe(2);
    });

    it('gives 2 VP for each of 3 Estates gained at once (Hunting Grounds trashed)', async () => {
      const game = createGame({ kingdom: ['Chapel', 'Hunting Grounds'] });
      addBattlefieldToGame(game);
      game.alice.setHand(['Chapel', 'Hunting Grounds', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(copies('Copper', 10));

      await game.start();
      await game.playAction('Chapel');
      await game.chooseCards(['Hunting Grounds']);
      await game.chooseOption('Gain 3 Estates');

      expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Estate']);
      expect(game.alice.vpTokens).toBe(6);
    });

    it('still gives the VP when Watchtower trashes the gained Victory card first', async () => {
      const game = createGame({ kingdom: ['Watchtower'] });
      addBattlefieldToGame(game);
      game.alice.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
      game.alice.setDeck(copies('Copper', 10));

      await game.start();
      await game.endActionPhase();
      await game.playAllTreasures();
      await game.buy('Estate');

      const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
      expect(decision.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
      expect(decision.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Battlefield']);
      await game.chooseEffect('Watchtower');
      await game.chooseOption('Trash it');

      expect(game.trash).toEqual(['Estate']);
      expect(game.alice.vpTokens).toBe(2);
    });
  });
});
