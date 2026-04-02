import { Component, OnInit, inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';
import { CandidateProfileService } from '../../core/services/candidate-profile.service';
import { NotifyService } from '../../core/services/notify.service';
import { CandidateProfile } from '../../core/models/candidate-profile.model';
import { ExperienceService } from '../../core/services/experience.service';
import { EducationService } from '../../core/services/education.service';
import { Experience } from '../../core/models/experience.model';
import { Education } from '../../core/models/education.model';
import { Skill } from '../../core/models/skill.model';
import { SkillService } from '../../core/services/skill.service';
import { UserService } from '../../core/services/user.service';
import { MessageService } from '../../core/services/message.service';
import { UserBlockService } from '../../core/services/user-block.service';
import { ConnectionService } from '../../core/services/connection.service';
import { forkJoin } from 'rxjs';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton.component';

declare var Swal: any;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingSkeletonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private profileService = inject(CandidateProfileService);
  private expService = inject(ExperienceService);
  private eduService = inject(EducationService);
  private notifyService = inject(NotifyService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private skillService = inject(SkillService);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private blockService = inject(UserBlockService);
  private connectionService = inject(ConnectionService);

  user = this.authService.user;
  profilePictureTimestamp: number = Date.now();
  profile: CandidateProfile | null | undefined = null;
  experiences: Experience[] = [];
  educations: Education[] = [];
  loading = true;
  isEditing = false;
  saving = false;
  editForm!: FormGroup;
  isOwnProfile = true;
  otherUser: User | null = null;
  connectionStatus: 'NONE' | 'PENDING' | 'ACCEPTED' = 'NONE';
  connectionId: string | null = null;
  isBlocked = false;
  showMoreMenu = false;

  get currentExperience(): Experience | null {
    return this.experiences.length > 0 ? this.experiences[0] : null;
  }

  get currentEducation(): Education | null {
    return this.educations.length > 0 ? this.educations[0] : null;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('id');
      const currentUserId = this.authService.currentUserValue?.id;

      if (userId && userId !== currentUserId) {
        this.isOwnProfile = false;
        this.otherUser = null;
        this.profile = null;
        this.experiences = [];
        this.educations = [];
        this.loadOtherProfile(userId);
      } else {
        if (userId && userId === currentUserId) {
          this.router.navigate(['/profile'], { replaceUrl: true });
          return;
        }
        this.isOwnProfile = true;
        this.initForm();
        this.loadProfile();
      }
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  refreshIcons() {
  }

  private initForm() {
    this.editForm = this.fb.group({
      headline: [''],
      phoneNumber: [''],
      location: [''],
      bio: [''],
      linkedinUrl: [''],
      githubUrl: [''],
      portfolioUrl: [''],
      websiteUrl: ['']
    });
  }

  private loadProfile() {
    this.profileService.getMyProfile().subscribe({
      next: (p) => {
        this.profile = p;
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          this.authService.currentUser.set({
            ...currentUser,
            profile: p,
            photoUrl: p.photoUrl || currentUser.photoUrl
          });
        }
        this.loading = false;
        this.editForm.patchValue(p);
        if (p.id) {
          this.loadExperiences(p.id);
          this.loadEducations(p.id);
          this.loadSkills();
        }
      },
      error: (err) => {
        if (err.status === 404 && this.isOwnProfile) {
          const user = this.authService.currentUserValue;
          if (user) {
            this.createNewProfile(user);
          } else {
            this.loading = false;
          }
        } else {
          this.loading = false;
          this.notifyService.showError('Erreur', 'Impossible de charger votre profil.');
        }
      }
    });
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
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  private loadOtherProfile(userId: string) {
    this.loading = true;

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.otherUser = user;

        this.profileService.getProfileByUserId(userId).subscribe({
          next: (profile) => {
            this.profile = profile;
            this.loading = false;
            this.cdr.markForCheck();

            if (profile.id) {
              this.loadOtherExperiences(userId);
              this.loadOtherEducations(userId);
              this.loadOtherSkills(userId);
            }
            this.loadConnectionStatus(userId);
            this.loadBlockStatus(userId);
          },
          error: (err) => {
            if (err.status === 404) {
              this.profile = null;
              this.loading = false;
              this.cdr.markForCheck();
              this.loadConnectionStatus(userId);
              this.loadBlockStatus(userId);
            } else {
              this.loading = false;
              this.notifyService.showError('Erreur', 'Impossible de charger le profil.');
            }
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.notifyService.showError('Erreur', 'Utilisateur introuvable.');
      }
    });
  }

  private loadOtherExperiences(userId: string) {
    this.expService.getExperiencesByUserId(userId).subscribe((exps: Experience[]) => {
      this.experiences = exps;
      this.cdr.markForCheck();
    });
  }

  private loadOtherEducations(userId: string) {
    this.eduService.getEducationsByUserId(userId).subscribe((edus: Education[]) => {
      this.educations = edus;
      this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    });
  }

  loadEducations(pid: string) {
    this.eduService.getMyEducations().subscribe((edus: Education[]) => {
      this.educations = edus;
      this.cdr.markForCheck();
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
    if (user?.profile?.cvUrl) {
      this.cvUrl = user.profile.cvUrl;
      this.showCVViewer = true;
    }
  }

  getFullCVUrl(): string {
    const user = this.user();
    const cvUrl = user?.profile?.cvUrl || this.cvUrl;
    if (!cvUrl) return '';
    let fullUrl = cvUrl;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `http://localhost:8081${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
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
    Swal.fire({
      title: 'Photo de profil',
      text: hasPhoto ? 'Voir ou mettre à jour votre photo de profil.' : 'Aucune photo trouvée. Téléchargez-en une nouvelle.',
      showCancelButton: true,
      showDenyButton: hasPhoto,
      confirmButtonText: hasPhoto ? 'Voir' : 'Télécharger',
      denyButtonText: 'Télécharger un nouveau',
      preConfirm: () => {
        if (hasPhoto && user?.photoUrl) {
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

  goToCompanyCreate() {
    this.router.navigate(['/company-create']);
  }

  openCVAction() {
    const user = this.user();
    const hasCV = !!user?.profile?.cvUrl;
    Swal.fire({
      title: 'CV',
      text: hasCV ? 'Voir ou mettre à jour votre CV.' : 'Aucun CV trouvé. Téléchargez-en un nouveau.',
      showCancelButton: true,
      showDenyButton: hasCV,
      confirmButtonText: hasCV ? 'Voir' : 'Télécharger',
      denyButtonText: 'Télécharger un nouveau',
      preConfirm: () => {
        if (hasCV && user?.profile?.cvUrl) {
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
      this.profileService.uploadPhoto(f).subscribe({
        next: (res) => {
          this.profile = res;
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.currentUser.set({ ...currentUser, profile: res, photoUrl: res.photoUrl });
          }
          this.profilePictureTimestamp = Date.now();
          this.cdr.markForCheck();
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
      this.profileService.uploadCV(f).subscribe({
        next: (res) => {
          this.profile = res;
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.currentUser.set({ ...currentUser, profile: res, photoUrl: res.photoUrl || currentUser.photoUrl });
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

  showSkillEditor = false;
  pendingSkills: string[] = [];
  newSkillName = '';
  savingSkills = false;

  openSkillEditor() {
    this.pendingSkills = [];
    this.showSkillEditor = true;
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
    const obs = this.pendingSkills.map((name: string) => this.skillService.createSkill({ name }));
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
      title: 'Nouvelle Expérience',
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
        return { title: t, company: c, startDate: s, endDate: e || null, description: d }
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
      title: 'Nouvelle Formation',
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
        return { school: sch, degree: deg, fieldOfStudy: fos, startDate: s, endDate: e || null, description: d }
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
      title: 'Modifier Expérience',
      html: `
        <div class="space-y-4 text-left p-2">
          <input id="sw-exp-title" class="swal2-input !w-full !m-0 !mt-2" placeholder="Poste *" value="${exp.title}">
          <input id="sw-exp-comp" class="swal2-input !w-full !m-0 !mt-4" placeholder="Entreprise *" value="${exp.companyName || ''}">
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
      title: 'Modifier Formation',
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

  deleteExperience(id: string) {
    this.notifyService.confirm('Supprimer cette expérience?', '', () => {
      this.expService.deleteExperience(id).subscribe({
        next: () => this.loadExperiences(this.profile!.id),
        error: () => this.notifyService.showError('Erreur', 'Impossible de supprimer l\'expérience')
      });
    });
  }

  deleteEducation(id: string) {
    this.notifyService.confirm('Supprimer cette formation?', '', () => {
      this.eduService.deleteEducation(id).subscribe({
        next: () => this.loadEducations(this.profile!.id),
        error: () => this.notifyService.showError('Erreur', 'Impossible de supprimer la formation')
      });
    });
  }

  showContactInfo() {
    const userObj = this.otherUser || this.user();
    if (!userObj) return;
    const cvUrl = (this.profile as any)?.cvUrl;
    const fullCvUrl = cvUrl
      ? (cvUrl.startsWith('http') ? cvUrl : `http://localhost:8081${cvUrl.startsWith('/') ? '' : '/'}${cvUrl}`)
      : null;
    const cvRow = fullCvUrl ? `
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span class="text-lg">ðŸ�S�~</span>
            </div>
            <div class="flex-1">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">CV</p>
              <a href="${fullCvUrl}" target="_blank" download
                 class="font-bold text-emerald-600 hover:underline flex items-center gap-1">
                <span class="text-sm">â¬⬡️</span>
                Télécharger le CV
              </a>
            </div>
          </div>` : '';
    Swal.fire({
      title: 'Informations de contact',
      html: `
        <div class="text-left space-y-3 p-2">
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <span class="text-lg">â�⬰️</span>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <p class="font-bold text-slate-700">${userObj.email || 'N/A'}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <span class="text-lg">ðŸ�Sž</span>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
              <p class="font-bold text-slate-700">${(this.profile as any)?.phoneNumber || 'Non renseigné'}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <span class="text-lg">ðŸ�S</span>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localisation</p>
              <p class="font-bold text-slate-700">${this.profile?.location || 'Non spécifiée'}</p>
            </div>
          </div>
          ${cvRow}
        </div>
      `,
      confirmButtonText: 'Fermer',
      confirmButtonColor: '#2563eb'
    });
  }

  openChangePassword() {
    this.userService.hasPassword().subscribe({
      next: (hasPassword) => {
        if (hasPassword) {
          this.showChangePasswordPopup();
        } else {
          this.showSetPasswordPopup();
        }
      },
      error: () => {
        this.showChangePasswordPopup();
      }
    });
  }

  private showSetPasswordPopup() {
    Swal.fire({
      title: 'Définir un mot de passe',
      html: `
        <div class="space-y-4 text-left p-2">
          <p class="text-sm text-slate-500 mb-4">Votre compte utilise uniquement Google. Définissez un mot de passe pour pouvoir aussi vous connecter par email.</p>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nouveau mot de passe</label>
            <input id="sw-sp-new" type="password" class="swal2-input !w-full !m-0" placeholder="â��¢â��¢â��¢â��¢â��¢â��¢â��¢â��¢">
            <p class="text-xs text-slate-400 mt-1">Minimum 8 caractères</p>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmer le mot de passe</label>
            <input id="sw-sp-confirm" type="password" class="swal2-input !w-full !m-0" placeholder="â��¢â��¢â��¢â��¢â��¢â��¢â��¢â��¢">
          </div>
        </div>
      `,
      confirmButtonText: 'Définir le mot de passe',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#6366f1',
      preConfirm: () => {
        const newPwd = (document.getElementById('sw-sp-new') as HTMLInputElement).value;
        const confirm = (document.getElementById('sw-sp-confirm') as HTMLInputElement).value;
        if (!newPwd || !confirm) {
          return Swal.showValidationMessage('Tous les champs sont requis.');
        }
        if (newPwd.length < 8) {
          return Swal.showValidationMessage('Le mot de passe doit contenir au moins 8 caractères.');
        }
        if (newPwd !== confirm) {
          return Swal.showValidationMessage('Les mots de passe ne correspondent pas.');
        }
        return { newPassword: newPwd, confirmedPassword: confirm };
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.userService.setPassword(result.value.newPassword, result.value.confirmedPassword).subscribe({
          next: () => {
            this.notifyService.showToast('Mot de passe défini avec succès!', 'success');
          },
          error: (err: any) => {
            this.notifyService.showError('Erreur', err?.error?.message || 'Échec de la définition du mot de passe.');
          }
        });
      }
    });
  }

  private showChangePasswordPopup() {
    Swal.fire({
      title: 'Changer le mot de passe',
      html: `
        <div class="space-y-4 text-left p-2">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe actuel</label>
            <input id="sw-cp-current" type="password" class="swal2-input !w-full !m-0" placeholder="â��¢â��¢â��¢â��¢â��¢â��¢â��¢â��¢">
          </div>
          <div class="mt-4">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nouveau mot de passe</label>
            <input id="sw-cp-new" type="password" class="swal2-input !w-full !m-0" placeholder="â��¢â��¢â��¢â��¢â��¢â��¢â��¢â��¢">
            <p class="text-xs text-slate-400 mt-1">Minimum 8 caractères</p>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmer le nouveau mot de passe</label>
            <input id="sw-cp-confirm" type="password" class="swal2-input !w-full !m-0" placeholder="â��¢â��¢â��¢â��¢â��¢â��¢â��¢â��¢">
          </div>
        </div>
      `,
      confirmButtonText: 'Mettre à jour',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#6366f1',
      preConfirm: () => {
        const current = (document.getElementById('sw-cp-current') as HTMLInputElement).value;
        const newPwd = (document.getElementById('sw-cp-new') as HTMLInputElement).value;
        const confirm = (document.getElementById('sw-cp-confirm') as HTMLInputElement).value;
        if (!current || !newPwd || !confirm) {
          return Swal.showValidationMessage('Tous les champs sont requis.');
        }
        if (newPwd.length < 8) {
          return Swal.showValidationMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        }
        if (newPwd !== confirm) {
          return Swal.showValidationMessage('Les nouveaux mots de passe ne correspondent pas.');
        }
        return { currentPassword: current, newPassword: newPwd, confirmedPassword: confirm };
      }
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.userService.changePassword(result.value.currentPassword, result.value.newPassword, result.value.confirmedPassword).subscribe({
          next: () => {
            this.notifyService.showToast('Mot de passe mis à jour avec succès!', 'success');
          },
          error: (err: any) => {
            this.notifyService.showError('Erreur', err?.error?.message || 'Échec de la mise à jour du mot de passe.');
          }
        });
      }
    });
  }

  private loadConnectionStatus(userId: string) {
    this.connectionService.getConnectionStatus(userId).subscribe({
      next: (resp: any) => {
        if (resp?.status === 'ACCEPTED') {
          this.connectionStatus = 'ACCEPTED';
          this.connectionId = resp.id;
        } else if (resp?.status === 'PENDING') {
          this.connectionStatus = 'PENDING';
          this.connectionId = resp.id;
        } else {
          this.connectionStatus = 'NONE';
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.connectionStatus = 'NONE';
        this.cdr.markForCheck();
      }
    });
  }

  private loadBlockStatus(userId: string) {
    this.blockService.getBlockedUsers().subscribe({
      next: (blocked) => {
        this.isBlocked = blocked.some(u => u.id === userId);
      },
      error: () => {}
    });
  }

  sendMessageToUser() {
    if (!this.otherUser) return;
    this.messageService.findOrCreateConversation(this.otherUser.id).subscribe({
      next: (conv) => {
        this.messageService.pendingConversationId.set(conv.id);
        this.router.navigate(['/messages']);
      },
      error: () => {
        this.notifyService.showError('Erreur', 'Impossible de créer la conversation.');
      }
    });
  }

  connectWithUser() {
    if (!this.otherUser || this.connectionStatus !== 'NONE') return;
    this.connectionService.sendConnectionRequest({ receiverId: this.otherUser.id }).subscribe({
      next: (resp: any) => {
        this.connectionStatus = 'PENDING';
        this.connectionId = resp.id;
        this.cdr.markForCheck();
        this.notifyService.showToast('Demande de connexion envoyée!', 'success');
      },
      error: (err) => {
        this.notifyService.showError('Erreur', err?.error?.message || 'Impossible d\'envoyer la demande.');
      }
    });
  }

  toggleBlockUser() {
    if (!this.otherUser) return;
    if (this.isBlocked) {
      this.blockService.unblockUser(this.otherUser.id).subscribe({
        next: () => {
          this.isBlocked = false;
          this.notifyService.showToast('Utilisateur débloqué', 'success');
        },
        error: () => this.notifyService.showError('Erreur', 'Impossible de débloquer l\'utilisateur.')
      });
    } else {
      this.notifyService.confirm('Bloquer cet utilisateur?', 'Il ne pourra plus vous contacter.', () => {
        this.blockService.blockUser(this.otherUser!.id).subscribe({
          next: () => {
            this.isBlocked = true;
            this.notifyService.showToast('Utilisateur bloqué', 'success');
          },
          error: () => this.notifyService.showError('Erreur', 'Impossible de bloquer l\'utilisateur.')
        });
      });
    }
  }

  removeConnectionFromProfile() {
    if (!this.connectionId) return;
    this.notifyService.confirm('Retirer cette connexion?', 'Vous ne serez plus connectés.', () => {
      this.connectionService.removeConnection(this.connectionId!).subscribe({
        next: () => {
          this.connectionStatus = 'NONE';
          this.connectionId = null;
          this.notifyService.showToast('Connexion retirée', 'info');
        },
        error: () => this.notifyService.showError('Erreur', 'Impossible de retirer la connexion.')
      });
    });
  }
}
