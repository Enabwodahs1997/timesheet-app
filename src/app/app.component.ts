import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AppComponent implements OnInit {
  dark = false;
  theme: 'auto' | 'light' | 'dark' = 'auto';
  showMenu = false;
  private mq?: MediaQueryList;

  ngOnInit(): void {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') this.theme = stored;
      else this.theme = 'auto';
    } catch (e) {
      this.theme = 'auto';
    }
    this.setupMediaListener();
    this.applyMode();
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  setTheme(t: 'auto' | 'light' | 'dark') {
    this.theme = t;
    try { localStorage.setItem('theme', t); } catch {}
    this.applyMode();
    this.showMenu = false;
  }

  private setupMediaListener() {
    if (window.matchMedia) {
      this.mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.mq.addEventListener?.('change', () => {
        if (this.theme === 'auto') this.applyMode();
      });
    }
  }

  private applyMode() {
    if (this.theme === 'dark') this.dark = true;
    else if (this.theme === 'light') this.dark = false;
    else this.dark = (this.mq ? this.mq.matches : window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) || false;

    if (this.dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }
}
