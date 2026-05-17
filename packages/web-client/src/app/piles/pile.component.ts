import { Component, computed, effect, inject, input, model, OnInit } from '@angular/core';
import { MessageDecoderService } from '../message-decoder.service';
import { CardMetadata, CardType, Cost, PileCategory, PileMetadata } from '@dominion/common';
import { convertToFileName } from '../util/NamingUtils';
import { DecisionManagerService } from '../decisions/decision-manager.service';
import { Decision, isBuyPhaseDecision, isChooseCardDecision, isTreasurePhaseDecision } from '../decisions/Decision';
import { CommonModule } from '@angular/common';
import { GlobalSettingsService } from '../settings/global-settings.service';
import { CoinComponent } from '../icons/coin.component';

@Component({
  selector: 'pile',
  templateUrl: './pile.component.html',
  styleUrls: ['./pile.component.css'],
  imports: [CoinComponent, CommonModule],
})
export class PileComponent implements OnInit {
  name = input.required<string>();
  fileName = computed<string>(() => convertToFileName(this.name()));

  count = model<number>(0);
  topCard = model<CardMetadata | undefined>(undefined);

  cost = input<Cost | undefined>(undefined);
  categories = input<PileCategory[]>([]);
  types = input<CardType[]>([]);

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);
  private readonly decisionManager = inject(DecisionManagerService);

  private globalSettings = inject(GlobalSettingsService);
  cardAssetDirectory = computed<string>(() => {
    return this.globalSettings.assetDirectory();
  });

  ngOnInit(): void {
    this.webSocketMessageDecoder.subscribeToPileMetadata((pileMetadataContent: PileMetadata) => {
      if (pileMetadataContent.name === this.name()) {
        this.count.set(pileMetadataContent.size);
        this.topCard.set(pileMetadataContent.topCard);
      }
    });
  }

  basicPileNames: Set<string> = new Set([
    'Copper',
    'Silver',
    'Gold',
    'Platinum',
    'Estate',
    'Duchy',
    'Province',
    'Colony',
    'Curse',
    'Potion',
  ]);
  isBasicPile = computed<boolean>(() => {
    return this.basicPileNames.has(this.name());
  });

  isKingdom = computed<boolean>(() => this.categories().includes(PileCategory.KINGDOM));
  isSupply = computed<boolean>(() => this.categories().includes(PileCategory.SUPPLY));

  isAction = computed<boolean>(() => this.types().includes(CardType.ACTION));
  isVictory = computed<boolean>(() => this.types().includes(CardType.VICTORY));
  isTreasure = computed<boolean>(() => this.types().includes(CardType.TREASURE));
  isCurse = computed<boolean>(() => this.types().includes(CardType.CURSE));

  isReaction = computed<boolean>(() => this.types().includes(CardType.REACTION));
  isDuration = computed<boolean>(() => this.types().includes(CardType.DURATION));

  isSelectable = computed<boolean>(() => {
    const decision: Decision | undefined = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    if (isTreasurePhaseDecision(decision) || isBuyPhaseDecision(decision) || isChooseCardDecision(decision)) {
      return this.topCard() !== undefined && decision.eligibleCardIds.has(this.topCard()!.id);
    }
    return false;
  });

  isEmpty = computed<boolean>(() => {
    return this.count() === 0;
  });

  costSymbol = computed<string>(() => {
    console.log(JSON.stringify(this.cost()));
    let coins: string = this.cost()?.coins.toFixed() ?? '';
    if (this.cost()?.has_asterisk) {
      coins += '*';
    }
    return coins;
  });

  selectPile(): void {
    if (this.isSelectable()) {
      this.decisionManager.resolveDecisionWithCard(this.topCard()!);
    }
  }
}
