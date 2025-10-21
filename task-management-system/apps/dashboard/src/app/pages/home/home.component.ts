import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskBoardComponent } from '../../components/task-board/task-board.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TaskBoardComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);

  get currentUser() {
    return this.auth.getCurrentUser();
  }

  logout(): void {
    this.auth.logout();
  }
}

