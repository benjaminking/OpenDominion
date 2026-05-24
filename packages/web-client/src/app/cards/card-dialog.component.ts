import { Component, computed, inject, input, model } from '@angular/core';

import { CardMetadata } from '@dominion/common';
import { CommonModule } from '@angular/common';
import { CardDisplayComponent } from './card-display.component';
import { ViewVisibilityService } from '../view-visibility.service';
import { ViewName } from '../view-names';

@Component({
  selector: 'card-dialog',
  templateUrl: './card-dialog.component.html',
  styleUrls: ['./card-dialog.component.css'],
  imports: [CommonModule, CardDisplayComponent],
})
export class CardDialogComponent {
  title = input.required<string>();
  name = input.required<ViewName>();
  cards = input.required<CardMetadata[]>();
  grouped = input<boolean>(false);
  sorted = input<boolean>(false);
  staggered = input<boolean>(false);

  private readonly viewVisibilityService = inject(ViewVisibilityService);

  visible = computed<boolean>(() => this.viewVisibilityService.getViewVisibilitySignal(this.name())());

  close(): void {
    this.viewVisibilityService.toggleViewByName(this.name());
  }
}
