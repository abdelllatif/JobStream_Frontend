import { Component, OnInit, inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User, AuthResponse } from '../../core/models/auth.model';
import { CandidateProfileService } from '../../core/services/candidate-profile.service';
import { FileService } from '../../core/services/file.service';
import { NotifyService } from '../../core/services/notify.service';
import { CandidateProfile } from '../../core/models/candidate-profile.model';
import { PremiumService } from '../../core/services/premium.service';
import { ExperienceService } from '../../core/services/experience.service';
import { EducationService } from '../../core/services/education.service';
import { Experience } from '../../core/models/experience.model';
import { Education } from '../../core/models/education.model';
import { Skill } from '../../core/models/skill.model';
import { SkillService } from '../../core/services/skill.service';
import { UserService } from '../../core/services/user.service';
import { forkJoin, Observable } from 'rxjs';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton.component';

declare var lucide: any;
declare var Swal: any;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSkeletonComponent],
  template: `
    <div class="min-h-screen pb-20">
      <div class="max-w-5xl mx-auto pt-8 space-y-6">
        
        <app-loading-skeleton *ngIf="loading"></app-loading-skeleton>

        <!-- Only show content when user is available -->
        <ng-container *ngIf="user()">
          <!-- Header -->
          <div *ngIf="!loading && user" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-4 lg:mx-0">
            <!-- Banner -->
            <div class="h-52 bg-gradient-to-r from-slate-800 to-slate-900 relative">
               <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>
            
              <div class="px-6 pb-6 relative">
              <div class="flex justify-between items-start">
                <!-- Profile) -->
                <div class="relative -mt-24 ml-4 group">
                  <div class="w-40 h-40 rounded-full bg-white p-1 shadow-xl ring-4 ring-white overflow-hidden">
                    <div class="w-full h-full rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-gray-100 relative">
                      <img *ngIf="(otherUser || user())?.photoUrl" [src]="(otherUser || user())?.photoUrl + '?t=' + profilePictureTimestamp" class="w-full h-full object-cover" 
                           (error)="onProfileImageError()">
                      <div *ngIf="!(otherUser || user())?.photoUrl" 
                           class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400 text-white text-4xl font-black">
                        {{ ((otherUser || user())?.firstName || (otherUser || user())?.email || '?').charAt(0) }}
                      </div>
                    </div>
                  </div>
                  <button *ngIf="isOwnProfile" (click)="fileInput.click()" class="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:text-primary-600 hover:scale-110 transition-all border border-gray-100 z-10">
                    <i data-lucide="camera" class="w-5 h-5"></i>
                  </button>
                  <input #fileInput id="profilePhotoInput" type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">
                  <input #cvFileInput id="cvFileInput" type="file" (change)="onCVSelected($event)" accept="application/pdf" class="hidden">
                </div>

                <div *ngIf="isOwnProfile" class="mt-4 flex space-x-2">
                   <button (click)="startEdit()" class="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Modifier le profil">
                      <i data-lucide="pencil" class="w-6 h-6"></i>
                   </button>
                   <button (click)="openCVAction()" class="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="CV: afficher / télécharger">
                      <i data-lucide="file-text" class="w-6 h-6"></i>
                   </button>
                   <button (click)="openPhotoAction()" class="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Photo de profil: afficher / télécharger">
                      <i data-lucide="camera" class="w-6 h-6"></i>
                   </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 px-4">
                <!-- LHS Content -->
                <div class="md:col-span-2">
                  <div class="flex items-center space-x-3">
                    <h1 class="text-3xl font-bold text-slate-900">{{ (otherUser || user())?.firstName || '' }} {{ (otherUser || user())?.lastName || '' }}</h1>
                    <span *ngIf="isPremium" class="px-2 py-0.5 bg-[#eeb013] text-white text-[10px] font-black rounded uppercase shadow-sm">PREMIUM</span>
                  </div>
                  <p class="text-lg text-slate-600 font-medium mt-1">{{ $any(profile)?.headline || 'Prêt pour de nouvelles opportunités' }}</p>
                  <div class="mt-2 flex items-center text-slate-500 text-sm">
                     <span class="font-medium mr-2">{{ $any(profile)?.location || 'Lieu non spécifié' }}</span>
                     <span>•</span>
                     <button (click)="showContactInfo()" class="text-primary-600 font-bold hover:underline ml-2">Informations de contact</button>
                  </div>
                </div>

                <!--  Info (Work/Education) -->
                <!-- ... -->
              </div>
              
              <!-- Social & CV Links -->
              <div class="flex flex-wrap gap-4 mt-8 px-4">
                 <a *ngIf="$any(profile)?.linkedinUrl" [href]="$any(profile)?.linkedinUrl" target="_blank" class="flex items-center space-x-2 text-slate-600 hover:text-primary-600 font-bold text-sm bg-slate-50 px-4 py-2 rounded-lg transition-colors border border-slate-100">
                    <i data-lucide="link" class="w-4 h-4 text-[#0077b5]"></i>
                    <span>LinkedIn</span>
                 </a>
                 <a *ngIf="$any(profile)?.githubUrl" [href]="$any(profile)?.githubUrl" target="_blank" class="flex items-center space-x-2 text-slate-600 hover:text-black font-bold text-sm bg-slate-50 px-4 py-2 rounded-lg transition-colors border border-slate-100">
                    <i data-lucide="github" class="w-4 h-4"></i>
                    <span>GitHub</span>
                 </a>
                 <a [href]="$any(profile)?.portfolioUrl || '#'" [class.opacity-50]="!$any(profile)?.portfolioUrl" target="_blank" class="flex items-center space-x-2 text-slate-600 hover:text-primary-600 font-bold text-sm bg-slate-50 px-4 py-2 rounded-lg transition-colors border border-slate-100">
                    <i data-lucide="globe" class="w-4 h-4 text-emerald-600"></i>
                    <span>{{ $any(profile)?.portfolioUrl ? 'Portfolio' : 'Portfolio non lié' }}</span>
                 </a>
                 <!-- Upload CV -->
              </div>
            </div>
          </div>

          <!-- Main Layout Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mx-4 lg:mx-0 mt-6">
            <!-- Left Column Content -->
            <div class="lg:col-span-2 space-y-6">
          <!-- About Section -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 class="text-xl font-bold text-slate-900 mb-4">Infos</h2>
            <p class="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
              {{ $any(profile)?.bio || 'Dites-en plus sur vous...' }}
            </p>
          </div>

              <!-- Experience Section -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-50 flex justify-between items-center">
                   <h2 class="text-xl font-bold text-slate-900">Expérience</h2>
                   <button (click)="addExperience()" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-full transition-all">
                      <i data-lucide="plus" class="w-6 h-6"></i>
                   </button>
                </div>
                <div class="p-6 space-y-8">
                   <div *ngFor="let exp of experiences" class="flex space-x-4 group border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                      <div class="w-12 h-12 bg-slate-100 rounded flex items-center justify-center shrink-0">
                         <i data-lucide="briefcase" class="w-6 h-6 text-slate-400"></i>
                      </div>
                      <div class="flex-1">
                         <div class="flex justify-between items-start">
                            <h3 class="font-bold text-slate-900">{{ exp.title }}</h3>
                            <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">
                               <button (click)="editExperience(exp)" class="p-1 text-slate-400 hover:text-slate-600"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                               <button (click)="deleteExperience(exp.id)" class="p-1 text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                         </div>
                         <p class="text-sm text-slate-800">{{ exp.company }}</p>
                         <p class="text-xs text-slate-500 mt-1 uppercase">
                            {{ exp.startDate | date:'MMM y' }} — {{ exp.endDate ? (exp.endDate | date:'MMM y') : 'Aujourd\\'hui' }}
                         </p>
                         <p class="text-sm text-slate-600 mt-3">{{ exp.description }}</p>
                      </div>
                   </div>
                   <div *ngIf="!experiences.length" class="text-center py-8 text-slate-400 text-sm italic">Aucune expérience ajoutée</div>
                </div>
              </div>

              <!-- Education Section -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-6 border-b border-gray-50 flex justify-between items-center">
                   <h2 class="text-xl font-bold text-slate-900">Formation</h2>
                   <button (click)="addEducation()" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-full transition-all">
                      <i data-lucide="plus" class="w-6 h-6"></i>
                   </button>
                </div>
                <div class="p-6 space-y-8">
                   <div *ngFor="let edu of educations" class="flex space-x-4 group border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                      <div class="w-12 h-12 bg-slate-100 rounded flex items-center justify-center shrink-0">
                         <i data-lucide="graduation-cap" class="w-6 h-6 text-slate-400"></i>
                      </div>
                      <div class="flex-1">
                         <div class="flex justify-between items-start">
                            <h3 class="font-bold text-slate-900">{{ edu.school }}</h3>
                            <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">
                               <button (click)="editEducation(edu)" class="p-1 text-slate-400 hover:text-slate-600"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                               <button (click)="deleteEducation(edu.id)" class="p-1 text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                         </div>
                         <p class="text-sm text-slate-800">{{ edu.school }}</p>
                         <p class="text-sm text-slate-800">{{ edu.degree }} {{ edu.fieldOfStudy ? '• ' + edu.fieldOfStudy : '' }}</p>
                         <p class="text-xs text-slate-500 mt-1 uppercase">
                            {{ edu.startDate | date:'y' }} — {{ edu.endDate ? (edu.endDate | date:'y') : 'Présent' }}
                         </p>
                         <p *ngIf="edu.description" class="text-sm text-slate-600 mt-3">{{ edu.description }}</p>
                      </div>
                   </div>
                   <div *ngIf="!educations.length" class="text-center py-8 text-slate-400 text-sm italic">Aucune formation ajoutée</div>
                </div>
              </div>

            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
               <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div class="flex justify-between items-center mb-4">
                     <h2 class="font-bold text-slate-900">Compétences</h2>
                     <button (click)="openSkillEditor()" class="text-slate-400 hover:text-primary-600"><i data-lucide="plus" class="w-5 h-5"></i></button>
                  </div>
                  <!-- Skill chips -->
                  <div class="flex flex-wrap gap-2">
                     <span *ngFor="let s of $any(profile)?.skills"
                           class="group px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                        {{ s.name }}
                        <button (click)="removeExistingSkill(s)" class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                     </span>
                     <span *ngIf="!$any(profile)?.skills?.length" class="text-xs text-slate-400 italic">Aucune compétence ajoutée</span>
                  </div>
               </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Edit Modal -->
      <div *ngIf="isEditing" class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
         <div class="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b flex justify-between items-center">
               <h2 class="text-xl font-bold">Modifier l'introduction</h2>
               <button (click)="isEditing = false" class="p-1 hover:bg-slate-100 rounded-full"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
               <div class="space-y-4">
                  <div>
                     <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Titre Professionnel</label>
                     <input formControlName="headline" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Téléphone</label>
                        <input formControlName="phoneNumber" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="+33 6 ...">
                     </div>
                     <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Localisation</label>
                        <input formControlName="location" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ville, Pays">
                     </div>
                  </div>
                  <div>
                     <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Résumé (Bio)</label>
                     <textarea formControlName="bio" rows="4" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"></textarea>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">LinkedIn</label>
                        <input formControlName="linkedinUrl" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://linkedin.com/in/...">
                     </div>
                     <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">GitHub</label>
                        <input formControlName="githubUrl" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://github.com/...">
                     </div>
                  </div>
                  <div>
                     <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Portfolio / Site Web</label>
                     <input formControlName="portfolioUrl" class="w-full border p-3 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="https://votre-site.com">
                  </div>
               </div>
               <div class="pt-6 flex justify-end space-x-3">
                  <button type="button" (click)="isEditing = false" class="px-6 py-2 font-bold text-slate-600 hover:bg-slate-50 rounded-full">Annuler</button>
                  <button type="submit" [disabled]="saving" class="px-8 py-2 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-700 shadow-md">
                     {{ saving ? 'Mise à jour...' : 'Enregistrer' }}
                  </button>
               </div>
            </form>
         </div>
      </div>

      <!-- Skill Editor Modal -->
      <div *ngIf="showSkillEditor" class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
         <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-5 border-b flex justify-between items-center">
               <h2 class="text-lg font-black text-slate-900">✨ Mes Compétences</h2>
               <button (click)="showSkillEditor = false" class="p-1 hover:bg-slate-100 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div class="p-5 space-y-4">
               <!-- Chip input -->
               <div class="flex gap-2">
                  <input #skillInput
                         [(ngModel)]="newSkillName"
                         (keydown.enter)="$event.preventDefault(); addSkillChip()"
                         placeholder="Nom de la compétence..."
                         class="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                  >
                  <button (click)="addSkillChip()"
                          class="px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 active:scale-95 transition-all">
                     Ajouter
                  </button>
               </div>

               <!-- Pending chips to add -->
               <div *ngIf="pendingSkills.length > 0">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">À ajouter</p>
                  <div class="flex flex-wrap gap-2">
                     <span *ngFor="let s of pendingSkills; let i = index"
                           class="flex items-center gap-1.5 px-3 py-1 bg-primary-50 border border-primary-200 text-primary-700 rounded-full text-xs font-bold">
                        {{ s }}
                        <button (click)="removeSkillChip(i)" class="text-primary-300 hover:text-red-500 transition-colors">
                           <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                     </span>
                  </div>
               </div>

               <p *ngIf="pendingSkills.length === 0" class="text-xs text-slate-400 italic text-center py-2">
                  Tapez une compétence et appuyez sur Entrée ou Ajouter.
               </p>
            </div>
            <div class="p-5 border-t flex justify-end gap-3">
               <button (click)="showSkillEditor = false" class="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl">Annuler</button>
               <button (click)="saveSkills()" [disabled]="savingSkills || pendingSkills.length === 0" class="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all">
                  {{ savingSkills ? 'Enregistrement...' : 'Enregistrer' }}
               </button>
            </div>
         </div>
      </div>
      <div *ngIf="showCVViewer" (click)="closeCVViewer()" class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
         <div (click)="$event.stopPropagation()" class="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-4 border-b flex justify-between items-center bg-gradient-to-r from-emerald-600 to-emerald-400">
               <h2 class="text-xl font-bold text-white">Mon CV</h2>
               <div class="flex items-center space-x-2">
                  <button (click)="downloadCV()" class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full transition-colors flex items-center">
                     <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                     Télécharger
                  </button>
                  <button (click)="closeCVViewer()" class="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
                     <i data-lucide="x" class="w-6 h-6"></i>
                  </button>
               </div>
            </div>
            <div class="flex-1 bg-gray-50 p-4">
               <div *ngIf="cvUrl" class="w-full h-full flex flex-col items-center justify-center">
                  <div class="text-center mb-6">
                     <i data-lucide="file-text" class="w-16 h-16 text-emerald-600 mx-auto mb-4"></i>
                     <h3 class="text-2xl font-bold text-gray-800 mb-2">CV PDF</h3>
                     <p class="text-gray-600 mb-4">Votre CV est prêt pour le téléchargement</p>
                     <div class="bg-white p-6 rounded-lg border border-gray-200 mb-4">
                        <p class="text-sm text-gray-600 mb-2">
                           <strong>Fichier:</strong> {{ (cvUrl || '').split('/').pop() || 'CV.pdf' }}
                        </p>
                        <p class="text-sm text-gray-600">
                           <strong>URL:</strong> 
                           <span class="text-xs break-all">{{ getFullCVUrl() }}</span>
                        </p>
                     </div>
                  </div>
                  <div class="flex space-x-4">
                     <button (click)="downloadCV()" class="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-colors">
                        <i data-lucide="download" class="w-5 h-5 mr-2"></i>
                        Télécharger le CV
                     </button>
                     <button (click)="openCVInNewTab()" class="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">
                        <i data-lucide="external-link" class="w-5 h-5 mr-2"></i>
                        Ouvrir dans le navigateur
                     </button>
                  </div>
               </div>
               <div *ngIf="!cvUrl" class="flex items-center justify-center h-full">
                  <p class="text-gray-500">Chargement du CV...</p>
               </div>
            </div>
         </div>
      </div>

  `,
  styles: [`
    :host ::ng-deep .swal2-popup {
      border-radius: 1rem !important;
      font-family: inherit !important;
    }
  `]
})
export class ProfileComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private profileService = inject(CandidateProfileService);
  private premiumService = inject(PremiumService);
  private expService = inject(ExperienceService);
  private eduService = inject(EducationService);
  private fileService = inject(FileService);
  private notifyService = inject(NotifyService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private skillService = inject(SkillService);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  user = this.authService.user; 
  profilePictureTimestamp: number = Date.now(); 
  profile: CandidateProfile | null | undefined = null;
  experiences: Experience[] = [];
  educations: Education[] = [];
  loading = true;
  isEditing = false;
  saving = false;
  isPremium = false;
  editForm!: FormGroup;
  isOwnProfile = true;
  otherUser: User | null = null;

  get currentExperience(): Experience | null {
    return this.experiences.length > 0 ? this.experiences[0] : null;
  }

  get currentEducation(): Education | null {
    return this.educations.length > 0 ? this.educations[0] : null;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      if (userId) {
        this.isOwnProfile = false;
        this.loadOtherProfile(userId);
      } else {
        this.isOwnProfile = true;
        this.initForm();
        this.loadProfile();
        this.checkPremium();
      }
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  refreshIcons() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        try {
          lucide.createIcons();
        } catch (error) {
          console.warn('Lucide icons not ready yet, retrying...');
          setTimeout(() => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
              lucide.createIcons();
            }
          }, 500);
        }
      }
    }, 100);
  }

  private initForm() {
    this.editForm = this.fb.group({
      headline: [''],
      phoneNumber: [''], // Using phoneNumber if it's in the model, or keep phone
      location: [''],
      bio: [''],
      linkedinUrl: [''],
      githubUrl: [''],
      portfolioUrl: [''],
      websiteUrl: ['']
    });
  }

  private checkPremium() {
    const user = this.authService.currentUserValue;
    if (user?.id) {
      this.premiumService.checkActiveSubscription(user.id).subscribe(s => this.isPremium = s);
    }
  }

  private loadProfile() {
    const user = this.authService.currentUserValue;
    console.log('Loading profile for user:', user);
    
    // If the profile is already in the user object, use it!
    if (user?.profile) {
      this.profile = user.profile;
      console.log('Using cached profile:', this.profile);
      console.log('Photo URL:', user.photoUrl);
      console.log('Profile photo URL:', user.profile?.photoUrl);
      console.log('CV URL:', user.profile?.cvUrl);
      // Ensure user.photoUrl is set
      if (user.profile.photoUrl && !user.photoUrl) {
        this.authService.currentUser.set({ ...user, photoUrl: user.profile.photoUrl });
      }
      this.loading = false;
      this.editForm.patchValue(user.profile);
      if (user.profile.id) {
        this.loadExperiences(user.profile.id);
        this.loadEducations(user.profile.id);
        this.loadSkills();
      }
      this.refreshIcons();
      return;
    }

    if (user?.id) {
      this.profileService.getMyProfile().subscribe({
        next: (p) => {
          console.log('Profile loaded from API:', p);
          console.log('Photo URL from API:', p.photoUrl);
          console.log('CV URL from API:', p.cvUrl);
          this.profile = p;
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.currentUser.set({ ...currentUser, profile: p, photoUrl: p.photoUrl });
          }
          this.loading = false;
          this.editForm.patchValue(p);
          if (p.id) {
            this.loadExperiences(p.id);
            this.loadEducations(p.id);
            this.loadSkills();
          }
          this.refreshIcons();
        },
        error: (err) => {
          if (err.status === 404 && this.isOwnProfile) {
            this.createNewProfile(user);
          } else {
            this.loading = false;
            this.notifyService.showError('Erreur', 'Impossible de charger votre profil.');
          }
        }
      });
    }
  }

  private createNewProfile(user: any) {
    const newProfile: Partial<CandidateProfile> = {
      userId: user.id,
      headline: '',
      phoneNumber: '',
      location: '',
      bio: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: ''
    };

    this.profileService.updateProfile(newProfile).subscribe({
      next: (createdProfile) => {
        this.profile = createdProfile;
        this.loading = false;
        this.editForm.patchValue(createdProfile);
        this.refreshIcons();
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  private loadOtherProfile(userId: string) {
    this.loading = true;
    forkJoin({
      user: this.userService.getUserById(userId),
      profile: this.profileService.getProfileByUserId(userId)
    }).subscribe({
      next: ({ user, profile }) => {
        this.otherUser = user;
        this.profile = profile;
        this.loading = false;
        if (profile.id) {
          this.loadOtherExperiences(userId);
          this.loadOtherEducations(userId);
          this.loadOtherSkills(userId);
        }
        this.refreshIcons();
      },
      error: (err) => {
        this.loading = false;
        this.notifyService.showError('Erreur', 'Impossible de charger le profil.');
      }
    });
  }

  private loadOtherExperiences(userId: string) {
    this.expService.getExperiencesByUserId(userId).subscribe((exps: Experience[]) => {
      this.experiences = exps;
      this.refreshIcons();
    });
  }

  private loadOtherEducations(userId: string) {
    this.eduService.getEducationsByUserId(userId).subscribe((edus: Education[]) => {
      this.educations = edus;
      this.refreshIcons();
    });
  }

  private loadOtherSkills(userId: string) {
    this.skillService.getSkillsByUserId(userId).subscribe((skills: Skill[]) => {
      if (this.profile) {
        (this.profile as any).skills = skills;
      }
      this.cdr.markForCheck();
    });
  }

  loadExperiences(pid: string) {
    this.expService.getMyExperiences().subscribe((exps: Experience[]) => {
      this.experiences = exps;
      this.refreshIcons();
    });
  }

  loadEducations(pid: string) {
    this.eduService.getMyEducations().subscribe((edus: Education[]) => {
      this.educations = edus;
      this.refreshIcons();
    });
  }

  loadSkills() {
    this.skillService.getMySkills().subscribe((skills: Skill[]) => {
      if (this.profile) {
        (this.profile as any).skills = skills;
      }
      this.cdr.markForCheck();
    });
  }

  startEdit() {
    this.isEditing = true;
    this.refreshIcons();
  }

  saveProfile() {
    this.saving = true;
    const data = { ...this.profile, ...this.editForm.value };

    this.profileService.updateProfile(data).subscribe({
      next: (res) => {
        this.profile = res;
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          this.authService.currentUser.set({ ...currentUser, profile: res, photoUrl: res.photoUrl });
        }
        this.saving = false;
        this.isEditing = false;
        this.refreshIcons();
        this.notifyService.saveSuccess('Profil');
      },
      error: () => {
        this.saving = false;
        this.notifyService.saveError('Profil');
      }
    });
  }

  showCVViewer = false;
  cvUrl: string | null = null;

  viewCV(): void {
    const user = this.user();
    console.log('Viewing CV, user profile:', user?.profile);
    console.log('CV URL:', user?.profile?.cvUrl);
    if (user?.profile?.cvUrl) {
      this.cvUrl = user.profile.cvUrl;
      this.showCVViewer = true;
    } else {
      console.warn('No CV URL found');
    }
  }

  getFullCVUrl(): string {
    const user = this.user();
    const cvUrl = user?.profile?.cvUrl || this.cvUrl;
    console.log('getFullCVUrl - cvUrl:', cvUrl);
    if (!cvUrl) return '';
    let fullUrl = cvUrl;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `http://localhost:8081${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
      console.log('Constructed full URL:', fullUrl);
    }
    return fullUrl;
  }

  openCVInNewTab(): void {
    const fullUrl = this.getFullCVUrl();
    if (fullUrl) { window.open(fullUrl, '_blank'); }
  }

  downloadCV(): void {
    const user = this.user();
    if (user?.profile?.cvUrl) {
      const fullUrl = this.getFullCVUrl();
      if (!fullUrl) return;
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = 'CV.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.notifyService.showToast('CV téléchargé avec succès!', 'success');
    }
  }

  closeCVViewer(): void {
    this.showCVViewer = false;
    this.cvUrl = null;
  }

  onProfileImageError() {}

  openPhotoAction() {
    const user = this.user();
    const hasPhoto = !!user?.photoUrl;
    console.log('openPhotoAction - user:', user);
    console.log('openPhotoAction - hasPhoto:', hasPhoto);
    console.log('openPhotoAction - photoUrl:', user?.photoUrl);
    Swal.fire({
      title: 'Photo de profil',
      text: hasPhoto ? 'Voir ou mettre à jour votre photo de profil.' : 'Aucune photo trouvée. Téléchargez-en une nouvelle.',
      showCancelButton: true,
      showDenyButton: hasPhoto,
      confirmButtonText: hasPhoto ? 'Voir' : 'Télécharger',
      denyButtonText: 'Télécharger un nouveau',
      preConfirm: () => {
        if (hasPhoto && user?.photoUrl) {
          console.log('Opening photo URL:', user.photoUrl);
          window.open(user.photoUrl, '_blank');
        } else {
          this.triggerPhotoUpload();
        }
      }
    }).then((result: any) => {
      if (result.isDenied) {
        this.triggerPhotoUpload();
      }
    });
  }

  openCVAction() {
    const user = this.user();
    const hasCV = !!user?.profile?.cvUrl;
    console.log('openCVAction - user:', user);
    console.log('openCVAction - hasCV:', hasCV);
    console.log('openCVAction - cvUrl:', user?.profile?.cvUrl);
    Swal.fire({
      title: 'CV',
      text: hasCV ? 'Voir ou mettre à jour votre CV.' : 'Aucun CV trouvé. Téléchargez-en un nouveau.',
      showCancelButton: true,
      showDenyButton: hasCV,
      confirmButtonText: hasCV ? 'Voir' : 'Télécharger',
      denyButtonText: 'Télécharger un nouveau',
      preConfirm: () => {
        if (hasCV && user?.profile?.cvUrl) {
          console.log('Opening CV URL:', user.profile.cvUrl);
          this.openCVInNewTab();
        } else {
          this.triggerCVUpload();
        }
      }
    }).then((result: any) => {
      if (result.isDenied) {
        this.triggerCVUpload();
      }
    });
  }

  triggerPhotoUpload() {
    const input = document.getElementById('profilePhotoInput') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  triggerCVUpload() {
    const input = document.getElementById('cvFileInput') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onFileSelected(e: any) {
    const f = e.target.files[0];
    if (f) {
      console.log('Uploading photo file:', f.name, f.size);
      this.profileService.uploadPhoto(f).subscribe({
        next: (res) => {
          console.log('Photo upload response:', res);
          console.log('New photo URL:', res.photoUrl);
          this.profile = res;
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.currentUser.set({ ...currentUser, profile: res, photoUrl: res.photoUrl });
          }
          this.profilePictureTimestamp = Date.now();
          this.cdr.markForCheck();
          this.refreshIcons();
          this.notifyService.fileUploadSuccess('Photo de profil');
        },
        error: (err) => {
          console.error('Photo upload error:', err);
          this.notifyService.fileUploadError('Photo de profil');
        }
      });
    }
  }

  onCVSelected(e: any) {
    const f = e.target.files[0];
    if (f) {
      console.log('Uploading CV file:', f.name, f.size);
      this.profileService.uploadCV(f).subscribe({
        next: (res) => {
          console.log('CV upload response:', res);
          console.log('New CV URL:', res.cvUrl);
          this.profile = res;
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.currentUser.set({ ...currentUser, profile: res });
          }
          this.showCVViewer = true;
          this.cvUrl = res.cvUrl || null;
          this.notifyService.fileUploadSuccess('CV');
        },
        error: (err) => {
          console.error('CV upload error:', err);
          this.notifyService.fileUploadError('CV');
        }
      });
    }
  }

  // Skill management properties
  showSkillEditor = false;
  pendingSkills: string[] = [];
  newSkillName = '';
  savingSkills = false;

  openSkillEditor() {
    this.pendingSkills = [];
    this.showSkillEditor = true;
    this.refreshIcons();
  }

  addSkillChip() {
    const name = this.newSkillName.trim();
    if (name) {
      this.pendingSkills.push(name);
      this.newSkillName = '';
    }
  }

  removeSkillChip(index: number) {
    this.pendingSkills.splice(index, 1);
  }

  removeExistingSkill(skill: any) {
    this.skillService.deleteSkill(skill.id).subscribe({
      next: () => {
        if (this.profile?.skills) {
          (this.profile as any).skills = this.profile.skills.filter((s: any) => s.id !== skill.id);
        }
        this.cdr.markForCheck();
      },
      error: () => this.notifyService.showError('Erreur', 'Impossible de supprimer la compétence')
    });
  }

  saveSkills() {
    if (!this.pendingSkills.length || !this.profile) return;
    this.savingSkills = true;
    const obs = this.pendingSkills.map((name: string) => this.skillService.createSkill({ name, candidateProfileId: this.profile!.id }));
    forkJoin(obs).subscribe({
      next: () => {
        this.savingSkills = false;
        this.showSkillEditor = false;
        this.pendingSkills = [];
        this.loadSkills();
        this.notifyService.saveSuccess('Compétences');
      },
      error: () => {
        this.savingSkills = false;
      }
    });
  }

  addExperience() {
    if (!this.profile) return;
    Swal.fire({
      title: '💼 Nouvelle Expérience',
      html: `
        <div class="space-y-4 text-left p-2">
          <input id="sw-exp-title" class="swal2-input !w-full !m-0 !mt-2" placeholder="Poste *">
          <input id="sw-exp-comp" class="swal2-input !w-full !m-0 !mt-4" placeholder="Entreprise *">
          <div class="grid grid-cols-2 gap-4 mt-4">
            <input id="sw-exp-start" type="date" class="swal2-input !m-0">
            <input id="sw-exp-end" type="date" class="swal2-input !m-0">
          </div>
          <textarea id="sw-exp-desc" class="swal2-textarea !w-full !m-0 !mt-4" placeholder="Description"></textarea>
        </div>
      `,
      confirmButtonText: 'Ajouter',
      preConfirm: () => {
        const t = (document.getElementById('sw-exp-title') as any).value;
        const c = (document.getElementById('sw-exp-comp') as any).value;
        const s = (document.getElementById('sw-exp-start') as any).value;
        const e = (document.getElementById('sw-exp-end') as any).value;
        const d = (document.getElementById('sw-exp-desc') as any).value;
        if (!t || !c || !s) return Swal.showValidationMessage('Remplis les champs *');
        return { title: t, company: c, startDate: s, endDate: e || null, description: d, candidateProfileId: this.profile!.id }
      }
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.expService.createExperience(r.value).subscribe({
          next: () => {
            this.loadExperiences(this.profile!.id);
            this.notifyService.createSuccess('Expérience');
          },
          error: () => {
            this.notifyService.createError('Expérience');
          }
        });
      }
    });
  }

  addEducation() {
    if (!this.profile) return;
    Swal.fire({
      title: '🎓 Nouvelle Formation',
      html: `
        <div class="space-y-4 text-left p-2">
          <input id="sw-edu-sch" class="swal2-input !w-full !m-0 !mt-2" placeholder="École *">
          <input id="sw-edu-deg" class="swal2-input !w-full !m-0 !mt-4" placeholder="Diplôme">
          <input id="sw-edu-fos" class="swal2-input !w-full !m-0 !mt-4" placeholder="Domaine d'études">
          <div class="grid grid-cols-2 gap-4 mt-4">
            <input id="sw-edu-start" type="date" class="swal2-input !m-0">
            <input id="sw-edu-end" type="date" class="swal2-input !m-0">
          </div>
          <textarea id="sw-edu-desc" class="swal2-textarea !w-full !m-0 !mt-4" placeholder="Description"></textarea>
        </div>
      `,
      confirmButtonText: 'Ajouter',
      preConfirm: () => {
        const sch = (document.getElementById('sw-edu-sch') as any).value;
        const deg = (document.getElementById('sw-edu-deg') as any).value;
        const fos = (document.getElementById('sw-edu-fos') as any).value;
        const s = (document.getElementById('sw-edu-start') as any).value;
        const e = (document.getElementById('sw-edu-end') as any).value;
        const d = (document.getElementById('sw-edu-desc') as any).value;
        if (!sch) return Swal.showValidationMessage('Remplis le champ École');
        return { school: sch, degree: deg, fieldOfStudy: fos, startDate: s, endDate: e || null, description: d, candidateProfileId: this.profile!.id }
      }
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.eduService.createEducation(r.value).subscribe({
          next: () => {
            this.loadEducations(this.profile!.id);
            this.notifyService.createSuccess('Formation');
          },
          error: () => {
            this.notifyService.createError('Formation');
          }
        });
      }
    });
  }

  editExperience(exp: Experience) {
    Swal.fire({
      title: '✏️ Modifier Expérience',
      html: `
        <div class="space-y-4 text-left p-2">
          <input id="sw-exp-title" class="swal2-input !w-full !m-0 !mt-2" placeholder="Poste *" value="${exp.title}">
          <input id="sw-exp-comp" class="swal2-input !w-full !m-0 !mt-4" placeholder="Entreprise *" value="${exp.company}">
          <div class="grid grid-cols-2 gap-4 mt-4">
            <input id="sw-exp-start" type="date" class="swal2-input !m-0" value="${exp.startDate.split('T')[0]}">
            <input id="sw-exp-end" type="date" class="swal2-input !m-0" value="${exp.endDate ? exp.endDate.split('T')[0] : ''}">
          </div>
          <textarea id="sw-exp-desc" class="swal2-textarea !w-full !m-0 !mt-4" placeholder="Description">${exp.description || ''}</textarea>
        </div>
      `,
      confirmButtonText: 'Modifier',
      preConfirm: () => {
        const t = (document.getElementById('sw-exp-title') as any).value;
        const c = (document.getElementById('sw-exp-comp') as any).value;
        const s = (document.getElementById('sw-exp-start') as any).value;
        const e = (document.getElementById('sw-exp-end') as any).value;
        const d = (document.getElementById('sw-exp-desc') as any).value;
        if (!t || !c || !s) return Swal.showValidationMessage('Remplis les champs *');
        return { ...exp, title: t, company: c, startDate: s, endDate: e || null, description: d }
      }
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.expService.updateExperience(exp.id!, r.value).subscribe({
          next: () => {
            this.loadExperiences(this.profile!.id);
            this.notifyService.saveSuccess('Expérience');
          },
          error: () => this.notifyService.saveError('Expérience')
        });
      }
    });
  }

  editEducation(edu: Education) {
    Swal.fire({
      title: '✏️ Modifier Formation',
      html: `
        <div class="space-y-4 text-left p-2">
          <input id="sw-edu-sch" class="swal2-input !w-full !m-0 !mt-2" placeholder="École *" value="${edu.school}">
          <input id="sw-edu-deg" class="swal2-input !w-full !m-0 !mt-4" placeholder="Diplôme" value="${edu.degree}">
          <input id="sw-edu-fos" class="swal2-input !w-full !m-0 !mt-4" placeholder="Domaine d'études" value="${edu.fieldOfStudy || ''}">
          <div class="grid grid-cols-2 gap-4 mt-4">
            <input id="sw-edu-start" type="date" class="swal2-input !m-0" value="${edu.startDate.split('T')[0]}">
            <input id="sw-edu-end" type="date" class="swal2-input !m-0" value="${edu.endDate ? edu.endDate.split('T')[0] : ''}">
          </div>
          <textarea id="sw-edu-desc" class="swal2-textarea !w-full !m-0 !mt-4" placeholder="Description">${edu.description || ''}</textarea>
        </div>
      `,
      confirmButtonText: 'Modifier',
      preConfirm: () => {
        const sch = (document.getElementById('sw-edu-sch') as any).value;
        const deg = (document.getElementById('sw-edu-deg') as any).value;
        const fos = (document.getElementById('sw-edu-fos') as any).value;
        const s = (document.getElementById('sw-edu-start') as any).value;
        const e = (document.getElementById('sw-edu-end') as any).value;
        const d = (document.getElementById('sw-edu-desc') as any).value;
        if (!sch) return Swal.showValidationMessage('Remplis le champ École');
        return { ...edu, school: sch, degree: deg, fieldOfStudy: fos, startDate: s, endDate: e || null, description: d }
      }
    }).then((r: any) => {
      if (r.isConfirmed) {
        this.eduService.updateEducation(edu.id!, r.value).subscribe({
          next: () => {
            this.loadEducations(this.profile!.id);
            this.notifyService.saveSuccess('Formation');
          },
          error: () => this.notifyService.saveError('Formation')
        });
      }
    });
  }

  deleteExperience(id: number) {
    this.notifyService.confirm('Supprimer cette expérience?', '', () => {
      this.expService.deleteExperience(id).subscribe({
        next: () => this.loadExperiences(this.profile!.id),
        error: () => this.notifyService.showError('Erreur', 'Impossible de supprimer l\'expérience')
      });
    });
  }

  deleteEducation(id: number) {
    this.notifyService.confirm('Supprimer cette formation?', '', () => {
      this.eduService.deleteEducation(id).subscribe({
        next: () => this.loadEducations(this.profile!.id),
        error: () => this.notifyService.showError('Erreur', 'Impossible de supprimer la formation')
      });
    });
  }

  showContactInfo() {
    const userObj = this.user();
    if (!userObj) return;
    Swal.fire({
      title: '📇 Informations de contact',
      html: `
        <div class="text-left space-y-3 p-2">
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <i data-lucide="mail" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <p class="font-bold text-slate-700">${userObj.email || 'N/A'}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <i data-lucide="phone" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
              <p class="font-bold text-slate-700">${this.profile?.phoneNumber || 'Non renseigné'}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <i data-lucide="map-pin" class="w-5 h-5"></i>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localisation</p>
              <p class="font-bold text-slate-700">${this.profile?.location || 'Non spécifiée'}</p>
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'Fermer',
      confirmButtonColor: '#2563eb',
      didOpen: () => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });
  }
}
