import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, Expansion, GameResult, Mechanic, PileCategory } from '@dominion/common';

import { Card } from '../card/Card';
import { CardFactory } from '../card/CardFactory';
import { Game } from '../Game';
import { Pile } from '../piles/Pile';
import { PileFactory } from '../piles/PileFactory';
import { PileSizeLogic } from '../piles/PileSizeLogic';
import { SpecialPileLookup, SpecialPileSpecification, SpecialPileType } from '../piles/SpecialPiles';
import { PlayerSpecification } from '../players';
import { KingdomChooser } from './KingdomChooser';
import { PileSpecification } from './PileSpecification';
import { StartingDeckConfigurationBuilder } from './StartingDeckConfigurationBuilder';

export interface GameInitializerOptions {
  useColoniesPlatinum?: boolean;
  useShelters?: boolean;
}

export class GameInitializer {
  private readonly game: Game;
  private readonly startingDeckConfigurationBuilder: StartingDeckConfigurationBuilder =
    new StartingDeckConfigurationBuilder();
  private readonly pileFactory: PileFactory;
  private readonly kingdomChooser: KingdomChooser;
  private readonly specialPileLookup: SpecialPileLookup = new SpecialPileLookup();
  private readonly anyKingdomPileSpecification: PileSpecification = new PileSpecification(
    { requiredExpansions: [], requiredCoinCosts: [], requiredTypes: [] },
    true,
    true,
  );
  private readonly pileSizeLogic: PileSizeLogic;

  public constructor(
    private readonly players: PlayerSpecification[],
    private readonly requiredCardNames: string[],
    private readonly options: GameInitializerOptions = {},
  ) {
    this.game = new Game(this.players);
    this.pileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.kingdomChooser = new KingdomChooser(new CardFactory(this.game.getGameState()), this.requiredCardNames);
    this.pileSizeLogic = new PileSizeLogic(players.length);
    this.game.choosePlayerOrder();
    this.initializeGameState();
  }

  protected initializeGameState(): void {
    this.generateKingdomCards();
    this.addBasicTreasuresToSupply();
    this.addBasicVictoryCardsToSupply();
    for (const player of this.game.getPlayers()) {
      player.calculateScore();
    }
    this.createInitialDecks();
  }

  protected generateKingdomCards(): void {
    while (this.kingdomChooser.hasMoreKingdomCards()) {
      const randomizer = this.kingdomChooser.getNextKingdomRandomizer();
      if (randomizer === undefined) {
        break;
      }
      this.addKingdomPile(randomizer);
    }
    this.performKingdomLevelSetup();
  }

  public addRandomPile(pileSpecification: PileSpecification): Pile | undefined {
    const randomizer: Card | undefined = this.kingdomChooser.selectMatchingRandomizer(pileSpecification);
    if (randomizer === undefined) {
      return undefined;
    }
    this.addKingdomPile(randomizer);
  }

  private addKingdomPile(randomizer: Card): Pile {
    let pile: Pile;
    if (this.isSpecialPile(randomizer)) {
      pile = this.pileFactory.createSpecialPile(this.getSpecialPileSpecification(randomizer));
    } else {
      pile = this.pileFactory.createPile(
        CardInfoLookup.lookUpCardInfo(randomizer.getPileName()),
        new Set<PileCategory>([PileCategory.KINGDOM, PileCategory.SUPPLY]),
      );
    }
    this.game.getGameState().piles.addKingdomPile(pile);
    this.handleCardMechanics(randomizer);
    this.handleInitializationSetupRules(randomizer);
    return pile;
  }

  private isSpecialPile(randomizer: Card): boolean {
    return CardInfoLookup.lookUpCardInfo(randomizer.getPileName()).category === CardCategory.RANDOMIZER_ONLY;
  }

  private getSpecialPileSpecification(randomizer: Card): SpecialPileSpecification {
    const specialPileType: SpecialPileType = randomizer.getPileName() as SpecialPileType;
    return this.specialPileLookup.lookUpSpecialPile(specialPileType);
  }

  // move the details of standard initialization to Piles
  protected addBasicTreasuresToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Copper'),
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Silver'),
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Gold'),
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  protected addBasicVictoryCardsToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Estate'),
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Duchy'),
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Province'),
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );

    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Curse'),
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
  }

  private handleCardMechanics(randomizer: Card): void {
    this.game.getGameState().registerCardMechanics(randomizer);
    if (randomizer.usesMechanic(Mechanic.POTIONS)) {
      this.addPotionsToSupply();
    }
    if (randomizer.usesMechanic(Mechanic.REWARDS)) {
      this.addSpecialPile(SpecialPileType.REWARDS);
    }
    if (randomizer.usesMechanic(Mechanic.SPOILS)) {
      this.addNonSupplyPile('Spoils');
    }
    if (randomizer.usesMechanic(Mechanic.RUINS)) {
      this.addSpecialPile(SpecialPileType.RUINS);
    }
    if (randomizer.usesMechanic(Mechanic.MADMAN)) {
      this.addNonSupplyPile('Madman');
    }
  }

  private addSpecialPile(specialPileType: SpecialPileType) {
    const specialPileSpecification = this.specialPileLookup.lookUpSpecialPile(specialPileType);
    const specialPile: Pile = this.pileFactory.createSpecialPile(specialPileSpecification);
    if (specialPileSpecification.pileCategories.has(PileCategory.KINGDOM)) {
      this.game.getGameState().piles.addKingdomPile(specialPile);
    } else if (specialPileSpecification.pileCategories.has(PileCategory.SUPPLY)) {
      this.game.getGameState().piles.addNonKingdomSupplyPile(specialPile);
    } else if (specialPileSpecification.pileCategories.has(PileCategory.NON_SUPPLY)) {
      this.game.getGameState().piles.addNonSupplyPile(specialPile);
    }
  }

  private addNonSupplyPile(pileName: string): void {
    const pile: Pile = this.pileFactory.createPile(
      CardInfoLookup.lookUpCardInfo(pileName),
      new Set<PileCategory>([PileCategory.NON_SUPPLY]),
    );
    this.game.getGameState().piles.addNonSupplyPile(pile);
  }

  private handleInitializationSetupRules(randomizer: Card): void {
    while (randomizer.getSetupRules().hasAnyGameInitializationSetupRules()) {
      randomizer.getSetupRules().getNextGameInitializationSetupRule().applySetupRule(this);
    }
  }

  public replaceCardsInPiles(cardName: string, replacementCardName: string): void {
    this.game.getGameState().replaceCardsInPiles(cardName, replacementCardName);
  }

  private addPotionsToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Potion'),
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  private performKingdomLevelSetup() {
    if (this.arePlatinumAndColonyRequired()) {
      this.addPlatinumAndColonyToSupply();
    }
    if (this.areSheltersRequired()) {
      this.addSheltersToStartingDecks();
    }
    this.kingdomChooser.applyGameStateSetupRules(this.game.getGameState());
  }

  private arePlatinumAndColonyRequired(): boolean {
    if (typeof this.options.useColoniesPlatinum === 'boolean') {
      return this.options.useColoniesPlatinum;
    }
    return Math.random() < this.kingdomChooser.getProportionFromExpansion(Expansion.PROSPERITY);
  }

  private addPlatinumAndColonyToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Colony'),
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Platinum'),
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  private areSheltersRequired(): boolean {
    if (typeof this.options.useShelters === 'boolean') {
      return this.options.useShelters;
    }
    return Math.random() < this.kingdomChooser.getProportionFromExpansion(Expansion.DARK_AGES);
  }

  private addSheltersToStartingDecks(): void {
    this.startingDeckConfigurationBuilder.useShelters();
  }

  private createInitialDecks(): void {
    for (const player of this.game.getPlayers()) {
      player.getOwnedCards().initialize(this.startingDeckConfigurationBuilder.build());
    }
  }

  public async runGame(): Promise<GameResult> {
    return this.game.runGame();
  }
}
