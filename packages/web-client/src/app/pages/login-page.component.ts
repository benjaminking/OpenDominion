import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  public mode: 'login' | 'signup' = 'login';
  public errorMessage = '';
  public isSubmitting = false;

  protected readonly authForm;

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.authForm = this.formBuilder.nonNullable.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(128)]],
    });
  }

  public setMode(nextMode: 'login' | 'signup'): void {
    this.mode = nextMode;
    this.errorMessage = '';
  }

  public submit(): void {
    if (this.authForm.invalid || this.isSubmitting) {
      this.authForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    const { username, password } = this.authForm.getRawValue();
    const request$ =
      this.mode === 'signup' ? this.authService.signup(username, password) : this.authService.login(username, password);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl('/lobby');
      },
      error: (errorResponse: { error?: { error?: string } }) => {
        this.isSubmitting = false;
        this.errorMessage = errorResponse.error?.error ?? 'Authentication failed.';
      },
    });
  }
}
