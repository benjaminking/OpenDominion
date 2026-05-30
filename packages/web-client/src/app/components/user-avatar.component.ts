import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GlobalSettingsService } from '../settings/global-settings.service';
import { convertToFileName } from '../util/NamingUtils';
import { AvatarData } from '../services/table-api.service';

@Component({
  selector: 'user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.css',
})
export class UserAvatarComponent {
  public readonly username = input.required<string>();
  public readonly avatar = input<AvatarData | null | undefined>(null);
  public readonly online = input<boolean>(false);
  public readonly size = input<number>(36);

  private readonly globalSettings = inject(GlobalSettingsService);

  public readonly initials = computed(() => this.username().slice(0, 1).toUpperCase());

  public readonly initialsColor = computed(() => {
    const palette = ['#3a6fc9', '#3d9c5a', '#9c3d72', '#9c7a3d', '#3d8a9c', '#7a3d9c'];
    let hash = 0;
    for (const ch of this.username()) {
      hash = (Math.imul(31, hash) + ch.charCodeAt(0)) | 0;
    }
    return palette[Math.abs(hash) % palette.length];
  });

  public readonly artUrl = computed(() => {
    const av = this.avatar();
    if (!av) return null;
    return `${this.globalSettings.assetDirectory()}/${convertToFileName(av.cardName)}_155px.jpg`;
  });

  /** Inline styles for the <img> inside the circle to show the crop region. */
  public readonly imgStyle = computed(() => {
    const av = this.avatar();
    const s = this.size();
    if (!av) return {};
    const { x, y, s: cropS, ratio } = av.crop;
    const scaledW = s / cropS;
    const scaledH = scaledW * ratio;
    return {
      width: `${scaledW}px`,
      height: `${scaledH}px`,
      left: `${-(x * scaledW)}px`,
      top: `${-(y * scaledH)}px`,
    };
  });
}
