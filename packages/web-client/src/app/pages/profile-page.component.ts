import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { CardInfoLookup } from '@dominion/card-info';

import { AuthService } from '../auth/auth.service';
import { AvatarService, UserProfile } from '../services/avatar.service';
import { AvatarCrop, AvatarData } from '../services/table-api.service';
import { GlobalSettingsService } from '../settings/global-settings.service';
import { convertToFileName } from '../util/NamingUtils';
import { UserAvatarComponent } from '../components/user-avatar.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UserAvatarComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  public readonly profile = signal<UserProfile | null>(null);
  public readonly isLoading = signal(true);
  public readonly errorMessage = signal('');
  public readonly saveMessage = signal('');

  // Password change
  public readonly currentPassword = signal('');
  public readonly newPassword = signal('');
  public readonly confirmPassword = signal('');
  public readonly passwordError = signal('');
  public readonly passwordSuccess = signal('');
  public readonly isSavingPassword = signal(false);

  // Card search
  public readonly cardSearch = signal('');
  public readonly cardSuggestions = signal<string[]>([]);
  public readonly selectedCard = signal<string | null>(null);

  // Crop state (pixels relative to displayed image)
  private dragStart: { x: number; y: number } | null = null;
  private imgDispW = 0;
  private imgDispH = 0;
  private imgNatRatio = 1;

  public readonly isDragging = signal(false);
  public readonly cropRect = signal<{ left: number; top: number; size: number } | null>(null);
  public readonly pendingCrop = signal<AvatarCrop | null>(null);

  private readonly allCardNames: string[] = CardInfoLookup.getKingdomCardNames();

  @ViewChild('cropContainer') cropContainerRef?: ElementRef<HTMLDivElement>;

  public readonly isOwnProfile = computed(
    () => !!this.profile() && this.profile()!.id === this.authService.session()?.userId,
  );

  public readonly artUrl = computed(() => {
    const card = this.selectedCard();
    if (!card) return null;
    return `${this.globalSettings.assetDirectory()}/${convertToFileName(card)}_155px.jpg`;
  });

  public readonly cropRectStyle = computed(() => {
    const cr = this.cropRect();
    if (!cr) return {};
    return {
      left: `${cr.left}px`,
      top: `${cr.top}px`,
      width: `${cr.size}px`,
      height: `${cr.size}px`,
    };
  });

  public readonly pendingAvatarData = computed<AvatarData | null>(() => {
    const crop = this.pendingCrop();
    const card = this.selectedCard();
    if (!crop || !card) return null;
    return { cardName: card, crop };
  });

  /** Styles for the 80 px preview avatar image. */
  public readonly previewImgStyle = computed(() => {
    const av = this.pendingAvatarData();
    if (!av) return {};
    const size = 80;
    const { x, y, s, ratio } = av.crop;
    const scaledW = size / s;
    const scaledH = scaledW * ratio;
    return {
      width: `${scaledW}px`,
      height: `${scaledH}px`,
      left: `${-(x * scaledW)}px`,
      top: `${-(y * scaledH)}px`,
    };
  });

  private readonly globalSettings = inject(GlobalSettingsService);

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly avatarService: AvatarService,
  ) {}

  public ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId') ?? '';
    if (!userId) {
      this.router.navigateByUrl('/lobby');
      return;
    }
    this.avatarService.getUserProfile(userId).subscribe({
      next: ({ user }) => {
        this.isLoading.set(false);
        this.profile.set(user);
      },
      error: (err: { status?: number }) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.status === 404 ? 'User not found.' : 'Failed to load profile.');
      },
    });
  }

  public ngOnDestroy(): void {}

  // ── Card search ────────────────────────────────────────────────────────────

  public updateCardSearch(query: string): void {
    this.cardSearch.set(query);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      this.cardSuggestions.set([]);
      return;
    }
    this.cardSuggestions.set(this.allCardNames.filter((n) => n.toLowerCase().includes(trimmed)).slice(0, 8));
  }

  public hideSuggestions(): void {
    setTimeout(() => this.cardSuggestions.set([]), 150);
  }

  public selectCard(name: string): void {
    this.selectedCard.set(name);
    this.cardSearch.set(name);
    this.cardSuggestions.set([]);
    this.cropRect.set(null);
    this.pendingCrop.set(null);
  }

  // ── Crop interaction ───────────────────────────────────────────────────────

  public onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.imgDispW = img.clientWidth;
    this.imgDispH = img.clientHeight;
    this.imgNatRatio = img.naturalHeight / img.naturalWidth;
  }

  public startDrag(event: MouseEvent): void {
    if (!this.imgDispW) return;
    const container = this.cropContainerRef?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.dragStart = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    this.isDragging.set(true);
    this.cropRect.set(null);
    this.pendingCrop.set(null);
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    if (!this.isDragging() || !this.dragStart) return;
    const container = this.cropContainerRef?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const curX = Math.max(0, Math.min(event.clientX - rect.left, this.imgDispW));
    const curY = Math.max(0, Math.min(event.clientY - rect.top, this.imgDispH));
    const dx = curX - this.dragStart.x;
    const dy = curY - this.dragStart.y;
    const maxSize = Math.min(
      Math.abs(dx),
      Math.abs(dy),
      dx >= 0 ? this.imgDispW - this.dragStart.x : this.dragStart.x,
      dy >= 0 ? this.imgDispH - this.dragStart.y : this.dragStart.y,
    );
    const size = Math.max(10, maxSize);
    const left = dx >= 0 ? this.dragStart.x : this.dragStart.x - size;
    const top = dy >= 0 ? this.dragStart.y : this.dragStart.y - size;
    this.cropRect.set({ left: Math.max(0, left), top: Math.max(0, top), size });
  }

  @HostListener('document:mouseup')
  public onMouseUp(): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    const cr = this.cropRect();
    if (!cr || !this.imgDispW || cr.size < 10) {
      this.pendingCrop.set(null);
      return;
    }
    const x = Math.max(0, Math.min(cr.left / this.imgDispW, 0.98));
    const y = Math.max(0, Math.min(cr.top / this.imgDispH, 0.98));
    const s = Math.max(0.02, Math.min(cr.size / this.imgDispW, 1 - x));
    this.pendingCrop.set({ x, y, s, ratio: this.imgNatRatio });
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  public saveAvatar(): void {
    const av = this.pendingAvatarData();
    if (!av) return;
    this.avatarService.updateAvatar(av).subscribe({
      next: ({ avatar }) => {
        const prof = this.profile();
        if (prof) this.profile.set({ ...prof, avatar });
        const userId = this.authService.session()?.userId ?? '';
        this.avatarService.setAvatar(userId, avatar);
        this.saveMessage.set('Avatar saved!');
        setTimeout(() => this.saveMessage.set(''), 3000);
        this.clearSelection();
      },
      error: () => {
        this.errorMessage.set('Failed to save avatar.');
      },
    });
  }

  public clearSelection(): void {
    this.selectedCard.set(null);
    this.cardSearch.set('');
    this.cropRect.set(null);
    this.pendingCrop.set(null);
  }

  // ── Password change ────────────────────────────────────────────────────────

  public changePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (this.newPassword().length < 4) {
      this.passwordError.set('New password must be at least 4 characters.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    this.isSavingPassword.set(true);
    this.avatarService.changePassword(this.currentPassword(), this.newPassword()).subscribe({
      next: () => {
        this.isSavingPassword.set(false);
        this.passwordSuccess.set('Password changed successfully.');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        setTimeout(() => this.passwordSuccess.set(''), 4000);
      },
      error: (err: { error?: { error?: string } }) => {
        this.isSavingPassword.set(false);
        this.passwordError.set(err.error?.error ?? 'Failed to change password.');
      },
    });
  }
}
