import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private baseUrl = 'http://localhost:3692';
  private settings: any = {};

  constructor(private http: HttpClient) {}

  setSettings(data: any) {
    this.settings = data;
  }

  getSettings() {
    return this.settings;
  }

  fetchAllSettings() {
    return this.http.get<any[]>(`${this.baseUrl}/settings`);
  }

  applyCssVariablesFromSettings(settings: any[]) {
    const get = (key: string) => settings.find(s => s.key === key)?.value?.trim();
  
    const tabFontColor = get('TAB_CATEGORY_FONT_COLOR');
  
    const groupBodyBgColor = get('GROUP_BODY_BG_COLOR');
    const groupBodyBgTransparency = parseInt(get('GROUP_BODY_BG_TRANSPARENCY') || '', 10);
    const groupBodyFontColor = get('GROUP_BODY_FONT_COLOR');
  
    const groupTitleBgColor = get('GROUP_TITLE_BG_COLOR');
    const groupTitleBgTransparency = parseInt(get('GROUP_TITLE_BG_TRANSPARENCY') || '', 10);
    const groupTitleFontColor = get('GROUP_TITLE_FONT_COLOR');
  
    const groupBodyBgRgba =
      groupBodyBgColor && !isNaN(groupBodyBgTransparency)
        ? this.hexToRgba(groupBodyBgColor, groupBodyBgTransparency)
        : '';
  
    const groupTitleBgRgba =
      groupTitleBgColor && !isNaN(groupTitleBgTransparency)
        ? this.hexToRgba(groupTitleBgColor, groupTitleBgTransparency)
        : '';
  
    const existingStyle = document.getElementById('dashboard-vars');
    if (existingStyle) existingStyle.remove();
  
    const cssVars = `
      :root {
        ${tabFontColor ? `--tab-category-font-color: ${tabFontColor};` : ''}
        ${groupBodyBgRgba ? `--group-body-bg-color: ${groupBodyBgRgba};` : ''}
        ${groupBodyFontColor ? `--group-body-font-color: ${groupBodyFontColor};` : ''}
        ${groupTitleBgRgba ? `--group-title-bg-color: ${groupTitleBgRgba};` : ''}
        ${groupTitleFontColor ? `--group-title-font-color: ${groupTitleFontColor};` : ''}
      }
    `;
  
    console.log('💡 Injecting CSS Vars (via SettingsService):', cssVars);
  
    const styleTag = document.createElement('style');
    styleTag.id = 'dashboard-vars';
    styleTag.textContent = cssVars;
    document.head.appendChild(styleTag);
  }
  
  private hexToRgba(hex: string, percent: number): string {
    if (!hex || isNaN(percent)) return '';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = percent / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  

}
