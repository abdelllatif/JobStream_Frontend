import { Injectable } from '@angular/core';

declare var Swal: any;

@Injectable({ providedIn: 'root' })
export class NotifyService {
  showSuccess(title: string, message: string) {
    Swal.fire({ icon: 'success', title, text: message, timer: 3000, showConfirmButton: false });
  }

  showError(title: string, message: string) {
     Swal.fire({ icon: 'error', title, text: message });
  }

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') {
     const Toast = Swal.mixin({
       toast: true,
       position: 'top-end',
       showConfirmButton: false,
       timer: 3000,
       timerProgressBar: true
     });
     Toast.fire({ icon: type, title: message });
  }

  saveSuccess(module: string) {
    this.showSuccess('Enregistré', `${module} a été mis à jour avec succès.`);
  }

  saveError(module: string) {
    this.showError('Erreur', `Impossible de sauvegarder ${module}.`);
  }

  createSuccess(module: string) {
    this.showSuccess('Créé', `${module} a été créé avec succès.`);
  }

  createError(module: string) {
     this.showError('Erreur', `Impossible de créer ${module}.`);
  }

  fileUploadSuccess(name: string) {
    this.showToast(`${name} téléchargé avec succès!`, 'success');
  }

  fileUploadError(name: string) {
    this.showToast(`Erreur lors du téléchargement de ${name}.`, 'error');
  }

  confirm(title: string, text: string, callback: () => void) {
    Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
      borderRadius: '1rem'
    }).then((result: any) => {
      if (result.isConfirmed) {
        callback();
      }
    });
  }
}
