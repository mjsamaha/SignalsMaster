import { Injectable, inject } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private platform = inject(Platform);

  isIOS(): boolean {
    return this.platform.is('ios');
  }

  isAndroid(): boolean {
    return this.platform.is('android');
  }

  isMobile(): boolean {
    return this.platform.is('mobile');
  }

  isDesktop(): boolean {
    return this.platform.is('desktop');
  }

  isMobileWeb(): boolean {
    return this.platform.is('mobileweb');
  }

  isHybrid(): boolean {
    return this.platform.is('hybrid');
  }

  getPlatformClasses(): string[] {
    const classes: string[] = [];

    if (this.isIOS()) {
      classes.push('ios');
    }

    if (this.isAndroid()) {
      classes.push('android', 'md');
    }

    if (this.isMobile()) {
      classes.push('mobile');
    }

    if (this.isDesktop()) {
      classes.push('desktop');
    }

    if (this.isHybrid()) {
      classes.push('hybrid');
    }

    return classes;
  }

  async ready(): Promise<void> {
    await this.platform.ready();
  }
}
