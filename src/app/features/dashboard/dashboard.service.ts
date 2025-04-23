import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private baseUrl = 'http://localhost:3692';

  constructor(private http: HttpClient) {}

  getFullDashboard() {
    return this.http.get<any[]>(`${this.baseUrl}/link-categories`);
  }

  // CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES 
  // CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES 
  // CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES CATEGORIES 

  updateCategory(id: number, data: { name: string }) {
    return this.http.put(`${this.baseUrl}/link-categories/${id}`, data);
  }

  deleteCategory(id: number) {
    return this.http.delete(`${this.baseUrl}/link-categories/${id}`);
  }

  createCategory(data: { name: string }) {
    return this.http.post(`${this.baseUrl}/link-categories`, data);
  }

  reorderCategories(data: { id: number, position: number }[]) {
    return this.http.put(`${this.baseUrl}/link-categories/reorder`, data);
  }

  // LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS
  // LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS
  // LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS LINK GROUPS

  getAllLinkGroups() {
    return this.http.get<any[]>(`${this.baseUrl}/link-groups`);
  }

  createLinkGroup(data: { name: string; categoryId: number; position?: number }) {
    return this.http.post(`${this.baseUrl}/link-groups`, data);
  }

  updateLinkGroup(id: number, data: { name: string }) {
    return this.http.put(`${this.baseUrl}/link-groups/${id}`, data);
  }

  deleteLinkGroup(id: number) {
    return this.http.delete(`${this.baseUrl}/link-groups/${id}`);
  }

  reorderLinkGroups(data: { id: number, position: number }[]) {
    return this.http.put(`${this.baseUrl}/link-groups/reorder`, data);
  }

  reorderGroups(categoryId: number, groups: { id: number; position: number }[]) {
    return this.http.post(`${this.baseUrl}/link-groups/reorder`, {
      categoryId,
      groups
    });
  }

  // LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS 
  // LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS 
  // LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS LINKS 

  getAllLinks() {
    return this.http.get<any[]>(`${this.baseUrl}/links`);
  }

  createLink(data: {
    name: string;
    url: string;
    icon: string;
    description?: string;
    groupId: number;
    tags?: string[];
    position?: number;
  }) {
    return this.http.post(`${this.baseUrl}/links`, data);
  }

  updateLink(id: number, data: {
    name?: string;
    url?: string;
    icon?: string;
    description?: string;
    groupId?: number | null;
    tags?: string[];
  }) {
    return this.http.put(`${this.baseUrl}/links/${id}`, data);
  }

  reorderLinks(data: { id: number, position: number }[]) {
    return this.http.put(`${this.baseUrl}/links/reorder`, data);
  }
  
  deleteLink(id: number) {
    return this.http.delete(`${this.baseUrl}/links/${id}`);
  }
  
}
