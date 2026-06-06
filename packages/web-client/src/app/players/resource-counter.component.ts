import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { IconType } from '../icons/IconType';
import { CoinComponent } from '../icons/coin.component';
import { VPComponent } from '../icons/vp.component';

@Component({
  selector: 'resource-counter',
  templateUrl: './resource-counter.component.html',
  styleUrls: ['./resource-counter.component.css'],
  imports: [CommonModule, CoinComponent, VPComponent],
})
export class ResourceCounterComponent {
  label = input.required<string>();
  count = input.required<number>();
  iconType = input.required<IconType>();
}
