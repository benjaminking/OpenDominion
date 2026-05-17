import { Component, computed, input, model } from '@angular/core';

import { CardMetadata } from '@dominion/common';
import { CommonModule } from '@angular/common';
import { CardDisplayComponent } from './card-display.component';

@Component({
  selector: 'card-dialog',
  templateUrl: './card-dialog.component.html',
  styleUrls: ['./card-dialog.component.css'],
  imports: [CommonModule, CardDisplayComponent],
})
export class CardDialogComponent {
  title = input.required<string>();
  cards = input.required<CardMetadata[]>();
  visible = model.required<boolean>();
  grouped = input<boolean>(false);
  sorted = input<boolean>(false);
  staggered = input<boolean>(false);

  close(): void {
    this.visible.set(false);
  }
}
