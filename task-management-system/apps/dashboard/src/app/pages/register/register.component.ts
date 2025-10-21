import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrganizationsService, Organization } from '../../services/organizations.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly organizationsService = inject(OrganizationsService);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    organizationId: [null as number | null, [Validators.required]],
  });

  organizations: Organization[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.organizationsService.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations = orgs;
        if (orgs.length === 1) {
          this.form.patchValue({ organizationId: orgs[0].id });
        }
      },
      error: (err) => {
        console.error('Error loading organizations:', err);
        this.errorMessage = 'Failed to load organizations. Please try again.';
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const dto = this.form.value as { email: string; password: string; organizationId: number };
    this.auth.register(dto).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Registration failed';
        this.isLoading = false;
      },
    });
  }
}

