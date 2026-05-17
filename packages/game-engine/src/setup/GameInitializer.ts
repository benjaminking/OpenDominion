import { CardInfoLookup } from '@dominion/card-info';
import { CardType, Expansion, Mechanic, PileCategory } from '@dominion/common';

import { Card } from '../card/Card';
import { CardFactory } from '../card/CardFactory';
import { Game } from '../Game';
import { PileFactory } from '../piles/PileFactory';
import { PlayerSpecification } from '../players';
import { KingdomChooser } from './KingdomChooser';
import { Randomizers } from './Randomizers';
import { StartingDeckConfigurationBuilder } from './StartingDeckConfigurationBuilder';

export class GameInitializer {
  private static readonly DEFAULT_COPPER_PILE_SIZE: number = 56;
  private static readonly DEFAULT_SILVER_PILE_SIZE: number = 40;
  private static readonly DEFAULT_GOLD_PILE_SIZE: number = 30;
  private static readonly DEFAULT_PLATINUM_PILE_SIZE: number = 12;
  private static readonly DEFAULT_POTION_PILE_SIZE: number = 16;
  private static readonly DEFAULT_TWO_PLAYER_VICTORY_PILE_SIZE: number = 8;
  private static readonly DEFAULT_THREE_PLAYER_VICTORY_PILE_SIZE: number = 12;
  private static readonly DEFAULT_KINGDOM_PILE_SIZE: number = 10;

  private readonly game: Game;
  private readonly startingDeckConfigurationBuilder: StartingDeckConfigurationBuilder =
    new StartingDeckConfigurationBuilder();

  public constructor(
    private readonly players: PlayerSpecification[],
    private readonly requiredCardNames: string[],
  ) {
    this.game = new Game(this.players);
    this.game.choosePlayerOrder();
    this.initializeGameState();
  }

  protected initializeGameState(): void {
    this.generateKingdomCards();
    this.addBasicTreasuresToSupply();
    this.addBasicVictoryCardsToSupply();
    for (const player of this.game.getPlayers()) {
      player.getOwnedCards().calculatePoints();
    }
    this.createInitialDecks();
  }

  protected generateKingdomCards(): void {
    const randomizers: Randomizers = this.selectRandomizers();
    this.addCardsToKingdom(randomizers);
    this.performKingdomLevelSetup(randomizers);
  }

  private selectRandomizers(): Randomizers {
    const kingdomChooser = new KingdomChooser(new CardFactory(this.game.getGameState()));
    return kingdomChooser.selectRandomizers(this.requiredCardNames);
  }

  private addCardsToKingdom(randomizers: Randomizers): void {
    for (const randomizer of randomizers.getCards()) {
      this.addKingdomCard(randomizer);
    }
  }

  private addKingdomCard(randomizer: Card): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    const pileSize = this.determineKingdomPileSize(randomizer);
    this.game
      .getGameState()
      .piles.addKingdomPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo(randomizer.getPileName()),
          pileSize,
          new Set<PileCategory>([PileCategory.KINGDOM, PileCategory.SUPPLY]),
        ),
      );

    this.handleCardMechanics(randomizer);
  }

  private determineKingdomPileSize(randomizer: Card): number {
    if (!randomizer.hasType(CardType.VICTORY)) {
      return GameInitializer.DEFAULT_KINGDOM_PILE_SIZE;
    }

    return this.determineVictoryPileSize();
  }

  private determineVictoryPileSize(): number {
    if (this.players.length >= 3) {
      return GameInitializer.DEFAULT_THREE_PLAYER_VICTORY_PILE_SIZE;
    }
    return GameInitializer.DEFAULT_TWO_PLAYER_VICTORY_PILE_SIZE;
  }

  private determineCursePileSize(): number {
    return (this.players.length - 1) * 10;
  }

  // move the details of standard initialization to Piles
  protected addBasicTreasuresToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Copper'),
          GameInitializer.DEFAULT_COPPER_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Silver'),
          GameInitializer.DEFAULT_SILVER_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Gold'),
          GameInitializer.DEFAULT_GOLD_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  protected addBasicVictoryCardsToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    const victoryPileSize = this.determineVictoryPileSize();
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Estate'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Duchy'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Province'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );

    const cursePileSize = this.determineCursePileSize();
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Curse'),
          cursePileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
  }

  private handleCardMechanics(randomizer: Card): void {
    if (randomizer.usesMechanic(Mechanic.POTIONS)) {
      this.addPotionsToSupply();
    }
  }

  private addPotionsToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Potion'),
          GameInitializer.DEFAULT_POTION_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
  }

  private performKingdomLevelSetup(randomizers: Randomizers) {
    if (this.arePlatinumAndColonyRequired(randomizers)) {
      this.addPlatinumAndColonyToSupply();
    }
    if (this.areSheltersRequired(randomizers)) {
      this.addSheltersToStartingDecks();
    }
  }

  private arePlatinumAndColonyRequired(randomizers: Randomizers): boolean {
    return Math.random() < randomizers.getProportionFromExpansion(Expansion.PROSPERITY);
  }

  private addPlatinumAndColonyToSupply(): void {
    const pileFactory: PileFactory = new PileFactory(this.game.getGameState(), this.game.getMessageBroadcaster());
    const victoryPileSize = this.determineVictoryPileSize();
    this.game
      .getGameState()
      .piles.addBasicVictoryPile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Colony'),
          victoryPileSize,
          new Set<PileCategory>([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
        ),
      );
    this.game
      .getGameState()
      .piles.addBasicTreasurePile(
        pileFactory.createPile(
          CardInfoLookup.lookUpCardInfo('Platinum'),
          GameInitializer.DEFAULT_PLATINUM_PILE_SIZE,
          new Set<PileCategory>([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
        ),
      );
  }

  private areSheltersRequired(randomizers: Randomizers): boolean {
    return Math.random() < randomizers.getProportionFromExpansion(Expansion.DARK_AGES);
  }

  private addSheltersToStartingDecks(): void {
    this.startingDeckConfigurationBuilder.useShelters();
  }

  private createInitialDecks(): void {
    for (const player of this.game.getPlayers()) {
      player.getOwnedCards().initialize(this.startingDeckConfigurationBuilder.build());
    }
  }

  public async startGame(): Promise<void> {
    await this.game.startGame();
  }
}
