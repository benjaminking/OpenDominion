import { Component, effect, inject, input, signal } from '@angular/core';
import { CardMetadata } from '../../../../common/dist/card/CardMetadata';
import { MessageDecoderService } from '../message-decoder.service';
import { CardLocation, NumberType } from '@dominion/common';
import { ViewVisibilityService } from '../view-visibility.service';
import { ViewName } from '../view-names';
import { CardDialogComponent } from '../cards/card-dialog.component';
import { ResourceCounterComponent } from './resource-counter.component';
import { IconType } from '../icons/IconType';
import { Mechanic } from '@dominion/common';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../cards/card.component';

@Component({
  selector: 'main-player',
  templateUrl: './main-player.component.html',
  styleUrls: ['./main-player.component.css'],
  imports: [CommonModule, CardComponent, CardDialogComponent, ResourceCounterComponent],
})
export class MainPlayerComponent {
  name = input<string>('');
  deckSize = signal<number>(0);
  topDiscard = signal<CardMetadata | undefined>(undefined);
  discard = signal<CardMetadata[]>([]);
  setAside = signal<CardMetadata[]>([]);
  limbo = signal<CardMetadata[]>([]);

  actions = signal<number>(0);
  buys = signal<number>(0);
  coins = signal<number>(0);
  score = signal<number>(0);
  vp = signal<number>(0);
  coffers = signal<number>(0);
  villagers = signal<number>(0);
  favors = signal<number>(0);

  mechanicsInUse = new Set<Mechanic>();

  revealedCardsViewName = ViewName.REVEALED_LIMBO;
  setAsideCardsViewName = ViewName.SET_ASIDE;
  discardViewName = ViewName.DISCARD;

  vpIconType = IconType.VP;
  coinIconType = IconType.COIN;

  vpChipMechanic = Mechanic.VP_CHIPS;
  coffersMechanic = Mechanic.COFFERS;
  villagersMechanic = Mechanic.VILLAGERS;
  favorsMechanic = Mechanic.FAVORS;

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);
  private readonly viewVisibilityService = inject(ViewVisibilityService);

  constructor() {
    effect(() => {
      this.webSocketMessageDecoder.subscribeToCardCountUpdate(
        { owner: this.name(), location: CardLocation.DECK },
        (cardCountContent: { count: number }) => {
          this.deckSize.set(cardCountContent.count);
        },
      );
      this.webSocketMessageDecoder.subscribeToTopCardUpdate(
        { owner: this.name(), location: CardLocation.DISCARD },
        (topCardContent: { topCard: CardMetadata | undefined }) => {
          this.topDiscard.set(topCardContent.topCard);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardsUpdate(
        { owner: this.name(), location: CardLocation.DISCARD },
        (cardsContent: { cards: CardMetadata[] }) => {
          this.discard.set(cardsContent.cards);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardsUpdate(
        { owner: this.name(), location: CardLocation.SET_ASIDE },
        (cardsContent: { cards: CardMetadata[] }) => {
          this.setAside.set(cardsContent.cards);
        },
      );
      this.webSocketMessageDecoder.subscribeToCardsUpdate(
        { owner: this.name(), location: CardLocation.REVEAL_LIMBO },
        (cardsContent: { cards: CardMetadata[] }) => {
          this.limbo.set(cardsContent.cards);
        },
      );

      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.ACTIONS },
        (statisticContent: { value: number }) => {
          this.actions.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.BUYS },
        (statisticContent: { value: number }) => {
          this.buys.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.COINS },
        (statisticContent: { value: number }) => {
          this.coins.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.SCORE },
        (statisticContent: { value: number }) => {
          this.score.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.VP_CHIPS },
        (statisticContent: { value: number }) => {
          this.vp.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.COFFERS },
        (statisticContent: { value: number }) => {
          this.coffers.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.VILLAGERS },
        (statisticContent: { value: number }) => {
          this.villagers.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToStatisticUpdate(
        { owner: this.name(), type: NumberType.FAVORS },
        (statisticContent: { value: number }) => {
          this.favors.set(statisticContent.value);
        },
      );
      this.webSocketMessageDecoder.subscribeToMechanics((mechanicsContent: { mechanics: Mechanic[] }) => {
        for (const mechanic of mechanicsContent.mechanics) {
          this.mechanicsInUse.add(mechanic);
        }
      });
    });
  }

  toggleRevealedCardsViewer(): void {
    this.viewVisibilityService.toggleViewByName(ViewName.REVEALED_LIMBO);
  }

  toggleSetAsideCardsViewer(): void {
    this.viewVisibilityService.toggleViewByName(ViewName.SET_ASIDE);
  }

  isUsing(mechanic: Mechanic): boolean {
    return this.mechanicsInUse.has(mechanic);
  }
}
