# 🎯 Frontend Implementation Guide - Gamification System

## 📱 Ionic Angular Integration for Superese Achievements

This guide provides **clear and actionable instructions** for implementing the gamification system in the Superese Ionic Angular frontend.

---

## 🔌 API Endpoints Reference

### 📋 Public Endpoints

#### 1. Get All Achievements
```typescript
GET /achievements
// Returns: AchievementResponseDto[]
```

#### 2. Get User Public Achievements
```typescript
GET /achievements/user/:userId/achievements
// Returns: UserAchievementResponseDto[]
```

### 🔐 Authenticated Endpoints (Require Firebase Auth Token)

#### 3. Get My Achievements
```typescript
GET /achievements/my-achievements
Headers: { Authorization: 'Bearer <firebase-token>' }
// Returns: UserAchievementResponseDto[]
```

#### 4. Get My Progress
```typescript
GET /achievements/my-progress
Headers: { Authorization: 'Bearer <firebase-token>' }
// Returns: AchievementResponseDto[]
```

#### 5. Get New Badges Count
```typescript
GET /achievements/new-badges-count
Headers: { Authorization: 'Bearer <firebase-token>' }
// Returns: { count: number }
```

#### 6. Mark Badge as Seen
```typescript
PATCH /achievements/mark-badge-seen/:achievementId
Headers: { Authorization: 'Bearer <firebase-token>' }
// Returns: { success: boolean }
```

---

## 📊 Data Structures

### AchievementResponseDto
```typescript
interface AchievementResponseDto {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'personal' | 'goals_plans' | 'general';
  type: string;
  targetValue: number;
  iconKey: string;
  currentProgress?: number;        // Only in progress endpoint
  progressPercentage?: number;     // Only in progress endpoint
  isCompleted?: boolean;           // Only in progress endpoint
  unlockedAt?: Date;              // Only in progress endpoint
}
```

### UserAchievementResponseDto
```typescript
interface UserAchievementResponseDto {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'personal' | 'goals_plans' | 'general';
  iconKey: string;
  unlockedAt: Date;
  hasNewBadge: boolean;  // Use this for animations
}
```

---

## 🛠️ Implementation Steps

### 1. Create Achievement Service

**File:** `src/app/services/achievements.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';

export interface AchievementResponseDto {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'personal' | 'goals_plans' | 'general';
  type: string;
  targetValue: number;
  iconKey: string;
  currentProgress?: number;
  progressPercentage?: number;
  isCompleted?: boolean;
  unlockedAt?: Date;
}

export interface UserAchievementResponseDto {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'personal' | 'goals_plans' | 'general';
  iconKey: string;
  unlockedAt: Date;
  hasNewBadge: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  
  constructor(
    private api: ApiService,
    private afAuth: AngularFireAuth
  ) {}

  // Get authorization headers
  private async getAuthHeaders(): Promise<HttpHeaders> {
    const user = await this.afAuth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Public endpoints
  getAllAchievements(): Observable<AchievementResponseDto[]> {
    return this.api.get<AchievementResponseDto[]>(`achievements`);
  }

  getUserPublicAchievements(userId: string): Observable<UserAchievementResponseDto[]> {
    return this.api.get<UserAchievementResponseDto[]>(`achievements/user/${userId}/achievements`);
  }

  // Authenticated endpoints
  async getMyAchievements(): Promise<Observable<UserAchievementResponseDto[]>> {
    const headers = await this.getAuthHeaders();
    return this.api.get<UserAchievementResponseDto[]>(`achievements/my-achievements`, { headers });
  }

  async getMyProgress(): Promise<Observable<AchievementResponseDto[]>> {
    const headers = await this.getAuthHeaders();
    return this.api.get<AchievementResponseDto[]>(`achievements/my-progress`, { headers });
  }

  async getNewBadgesCount(): Promise<Observable<{ count: number }>> {
    const headers = await this.getAuthHeaders();
    return this.api.get<{ count: number }>(`achievements/new-badges-count`, { headers });
  }

  async markBadgeAsSeen(achievementId: string): Promise<Observable<{ success: boolean }>> {
    const headers = await this.getAuthHeaders();
    return this.api.patch<{ success: boolean }>(`achievements/mark-badge-seen/${achievementId}`, {}, { headers });
  }
}
```

### 2. Create Icon Mapping Service

**File:** `src/app/services/achievement-icons.service.ts`

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AchievementIconsService {
  
  // Map iconKey to Ionic icon names
  private iconMap: { [key: string]: string } = {
    // Social Icons
    'first_friend': 'person-add',
    'social_circle': 'people',
    'support_network': 'people-circle',
    'first_interaction': 'thumbs-up',
    'active_participant': 'chatbubbles',
    'social_engager': 'megaphone',
    'popular_post': 'flame',
    'content_creator': 'create',
    'first_conversation': 'chatbubble',
    
    // Personal Icons
    'first_entry': 'journal',
    'week_reflection': 'calendar',
    'month_journey': 'calendar-outline',
    'writing_habit': 'pencil',
    
    // Goals/Plans Icons
    'first_practice': 'checkmark-circle',
    'consistent_week': 'trophy',
    'constant_dedication': 'medal',
    'first_plan_completed': 'checkmark-done',
    'constant_progress': 'trending-up',
    'recovery_master': 'ribbon',
    'ai_plan_completed': 'bulb',
    'ai_partner': 'hardware-chip',
    
    // General Icons
    'deep_reflection': 'bulb-outline',
    'deep_thinker': 'library',
    'first_ai_help': 'help-circle',
    'ai_user': 'chatbox',
    'ai_collaborator': 'settings'
  };

  getIcon(iconKey: string): string {
    return this.iconMap[iconKey] || 'trophy'; // Default icon
  }

  // Get category color
  getCategoryColor(category: string): string {
    const colors = {
      'social': 'primary',      // Blue
      'personal': 'secondary',  // Green  
      'goals_plans': 'warning', // Orange
      'general': 'tertiary'     // Purple
    };
    return colors[category] || 'medium';
  }

  // Get category display name
  getCategoryName(category: string): string {
    const names = {
      'social': 'Social',
      'personal': 'Pessoal',
      'goals_plans': 'Metas e Planos',
      'general': 'Geral'
    };
    return names[category] || category;
  }
}
```

### 3. Create Achievements Page Component

**File:** `src/app/pages/achievements/achievements.page.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { AchievementsService, AchievementResponseDto, UserAchievementResponseDto } from '../../services/achievements.service';
import { AchievementIconsService } from '../../services/achievement-icons.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.page.html',
  styleUrls: ['./achievements.page.scss'],
})
export class AchievementsPage implements OnInit {
  
  achievements: AchievementResponseDto[] = [];
  userAchievements: UserAchievementResponseDto[] = [];
  selectedSegment: string = 'progress';
  loading: boolean = false;

  constructor(
    private achievementsService: AchievementsService,
    private iconsService: AchievementIconsService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const loading = await this.loadingCtrl.create({
      message: 'Carregando conquistas...'
    });
    await loading.present();

    try {
      // Load progress data
      const progressObs = await this.achievementsService.getMyProgress();
      progressObs.subscribe(data => {
        this.achievements = data;
      });

      // Load achievements data
      const achievementsObs = await this.achievementsService.getMyAchievements();
      achievementsObs.subscribe(data => {
        this.userAchievements = data;
      });

    } catch (error) {
      console.error('Error loading achievements:', error);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao carregar conquistas',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
    }
  }

  getIcon(iconKey: string): string {
    return this.iconsService.getIcon(iconKey);
  }

  getCategoryColor(category: string): string {
    return this.iconsService.getCategoryColor(category);
  }

  getCategoryName(category: string): string {
    return this.iconsService.getCategoryName(category);
  }

  // Group achievements by category
  getAchievementsByCategory(category: string): AchievementResponseDto[] {
    return this.achievements.filter(a => a.category === category);
  }

  getUserAchievementsByCategory(category: string): UserAchievementResponseDto[] {
    return this.userAchievements.filter(a => a.category === category);
  }

  async markBadgeAsSeen(achievement: UserAchievementResponseDto) {
    if (achievement.hasNewBadge) {
      try {
        const obs = await this.achievementsService.markBadgeAsSeen(achievement.id);
        obs.subscribe(() => {
          achievement.hasNewBadge = false;
        });
      } catch (error) {
        console.error('Error marking badge as seen:', error);
      }
    }
  }

  // Categories for iteration
  categories = ['social', 'personal', 'goals_plans', 'general'];
}
```

### 4. Create Achievements Page Template

**File:** `src/app/pages/achievements/achievements.page.html`

```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title>Conquistas</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Conquistas</ion-title>
    </ion-toolbar>
  </ion-header>

  <!-- Segment Control -->
  <ion-segment [(ngModel)]="selectedSegment" mode="md">
    <ion-segment-button value="progress">
      <ion-label>Progresso</ion-label>
    </ion-segment-button>
    <ion-segment-button value="achieved">
      <ion-label>Conquistadas</ion-label>
    </ion-segment-button>
  </ion-segment>

  <!-- Progress Tab -->
  <div *ngIf="selectedSegment === 'progress'">
    <div *ngFor="let category of categories" class="category-section">
      <ion-item-divider>
        <ion-label>{{ getCategoryName(category) }}</ion-label>
      </ion-item-divider>
      
      <ion-card *ngFor="let achievement of getAchievementsByCategory(category)">
        <ion-card-content>
          <div class="achievement-header">
            <ion-icon 
              [name]="getIcon(achievement.iconKey)" 
              [color]="getCategoryColor(achievement.category)"
              size="large">
            </ion-icon>
            <div class="achievement-info">
              <h3>{{ achievement.name }}</h3>
              <p>{{ achievement.description }}</p>
            </div>
            <div class="achievement-status" *ngIf="achievement.isCompleted">
              <ion-icon name="checkmark-circle" color="success" size="large"></ion-icon>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-section" *ngIf="!achievement.isCompleted">
            <div class="progress-info">
              <span>{{ achievement.currentProgress || 0 }} / {{ achievement.targetValue }}</span>
              <span>{{ achievement.progressPercentage || 0 }}%</span>
            </div>
            <ion-progress-bar 
              [value]="(achievement.progressPercentage || 0) / 100"
              [color]="getCategoryColor(achievement.category)">
            </ion-progress-bar>
          </div>

          <!-- Completed Badge -->
          <div class="completed-badge" *ngIf="achievement.isCompleted">
            <ion-chip [color]="getCategoryColor(achievement.category)">
              <ion-icon name="trophy"></ion-icon>
              <ion-label>Conquistada em {{ achievement.unlockedAt | date:'dd/MM/yyyy' }}</ion-label>
            </ion-chip>
          </div>
        </ion-card-content>
      </ion-card>
    </div>
  </div>

  <!-- Achieved Tab -->
  <div *ngIf="selectedSegment === 'achieved'">
    <div *ngFor="let category of categories" class="category-section">
      <ion-item-divider>
        <ion-label>{{ getCategoryName(category) }}</ion-label>
      </ion-item-divider>
      
      <ion-card 
        *ngFor="let achievement of getUserAchievementsByCategory(category)"
        [class.new-badge]="achievement.hasNewBadge"
        (click)="markBadgeAsSeen(achievement)">
        <ion-card-content>
          <div class="achievement-header">
            <div class="badge-container">
              <ion-icon 
                [name]="getIcon(achievement.iconKey)" 
                [color]="getCategoryColor(achievement.category)"
                size="large">
              </ion-icon>
              <!-- New Badge Indicator -->
              <div class="new-indicator" *ngIf="achievement.hasNewBadge">
                <ion-badge color="danger">NOVO!</ion-badge>
              </div>
            </div>
            <div class="achievement-info">
              <h3>{{ achievement.name }}</h3>
              <p>{{ achievement.description }}</p>
              <ion-chip [color]="getCategoryColor(achievement.category)" size="small">
                <ion-icon name="calendar"></ion-icon>
                <ion-label>{{ achievement.unlockedAt | date:'dd/MM/yyyy' }}</ion-label>
              </ion-chip>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Empty State -->
      <ion-card *ngIf="getUserAchievementsByCategory(category).length === 0">
        <ion-card-content class="empty-state">
          <ion-icon name="trophy-outline" size="large" color="medium"></ion-icon>
          <p>Nenhuma conquista nesta categoria ainda</p>
        </ion-card-content>
      </ion-card>
    </div>
  </div>
</ion-content>
```

### 5. Create Achievements Page Styles

**File:** `src/app/pages/achievements/achievements.page.scss`

```scss
.category-section {
  margin-bottom: 1rem;
}

.achievement-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.achievement-info {
  flex: 1;
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    color: var(--ion-color-dark);
  }
  
  p {
    margin: 0;
    color: var(--ion-color-medium);
    font-size: 0.9rem;
  }
}

.achievement-status {
  display: flex;
  align-items: center;
}

.progress-section {
  margin-top: 1rem;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: var(--ion-color-medium);
  }
}

.completed-badge {
  margin-top: 1rem;
}

.badge-container {
  position: relative;
  
  .new-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
  }
}

.new-badge {
  animation: pulse 2s infinite;
  border: 2px solid var(--ion-color-primary);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--ion-color-primary-rgb), 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--ion-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--ion-color-primary-rgb), 0);
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}
```

### 6. Add Badge Counter to Navigation

**Component where you want to show the badge count (e.g., tab bar or header):**

```typescript
// In your component
export class NavigationComponent implements OnInit {
  newBadgeCount: number = 0;

  constructor(private achievementsService: AchievementsService) {}

  async ngOnInit() {
    await this.loadBadgeCount();
    
    // Refresh badge count every 30 seconds
    setInterval(() => {
      this.loadBadgeCount();
    }, 30000);
  }

  async loadBadgeCount() {
    try {
      const obs = await this.achievementsService.getNewBadgesCount();
      obs.subscribe(data => {
        this.newBadgeCount = data.count;
      });
    } catch (error) {
      console.error('Error loading badge count:', error);
    }
  }
}
```

**Template for badge indicator:**
```html
<ion-tab-button tab="achievements">
  <ion-icon name="trophy"></ion-icon>
  <ion-label>Conquistas</ion-label>
  <ion-badge *ngIf="newBadgeCount > 0" color="danger">{{ newBadgeCount }}</ion-badge>
</ion-tab-button>
```

---

## 🎨 UI/UX Best Practices

### 1. **Badge Animations**
- Use `hasNewBadge` flag to trigger CSS animations
- Show "NOVO!" badge for recently unlocked achievements
- Implement pulse animation for new achievements

### 2. **Progress Indicators**
- Use `ion-progress-bar` for visual progress
- Show current/target values clearly
- Use category colors for consistency

### 3. **Category Organization**
- Group achievements by category
- Use consistent icons and colors
- Provide clear category names in Portuguese

### 4. **Real-time Updates**
- Poll badge count every 30 seconds
- Refresh achievement data when user returns to page
- Show loading states during API calls

### 5. **Empty States**
- Show friendly empty state messages
- Encourage user engagement
- Provide clear calls-to-action

---

## 🔧 Additional Features

### Achievement Toast Notifications
```typescript
// Service to show achievement unlock toasts
@Injectable({
  providedIn: 'root'
})
export class AchievementNotificationService {
  constructor(private toastCtrl: ToastController) {}

  async showAchievementUnlocked(achievementName: string, iconKey: string) {
    const toast = await this.toastCtrl.create({
      message: `🏆 Nova conquista desbloqueada: ${achievementName}!`,
      duration: 4000,
      position: 'top',
      color: 'success',
      buttons: [
        {
          text: 'Ver',
          role: 'info',
          handler: () => {
            // Navigate to achievements page
          }
        }
      ]
    });
    await toast.present();
  }
}
```

### Profile Achievement Display
```html
<!-- In user profile page -->
<div class="user-achievements">
  <h3>Conquistas Recentes</h3>
  <div class="achievement-badges">
    <div 
      *ngFor="let achievement of recentAchievements" 
      class="achievement-badge">
      <ion-icon 
        [name]="getIcon(achievement.iconKey)" 
        [color]="getCategoryColor(achievement.category)">
      </ion-icon>
      <span>{{ achievement.name }}</span>
    </div>
  </div>
</div>
```

---

## ✅ Implementation Checklist

- [ ] Create `AchievementsService` with all API calls
- [ ] Create `AchievementIconsService` for icon mapping
- [ ] Implement achievements page with progress and achieved tabs
- [ ] Add category-based organization and styling
- [ ] Implement badge counter in navigation
- [ ] Add new badge animations and indicators
- [ ] Test with Firebase authentication
- [ ] Add error handling and loading states
- [ ] Implement real-time badge count updates
- [ ] Add achievement unlock toast notifications
- [ ] Test across different screen sizes

---

## 🚀 Quick Start

1. **Install dependencies** (if not already installed):
```bash
npm install @angular/fire
```

2. **Generate achievements page**:
```bash
ionic generate page pages/achievements
```

3. **Create services**:
```bash
ionic generate service services/achievements
ionic generate service services/achievement-icons
```

4. **Copy the code** from this guide into the respective files

5. **Add routes** to your routing module:
```typescript
{
  path: 'achievements',
  loadChildren: () => import('./pages/achievements/achievements.module').then(m => m.AchievementsPageModule)
}
```

6. **Test the implementation** with your API endpoints

---

**🎮 READY TO IMPLEMENT! Your users will love the gamification experience! 🏆**