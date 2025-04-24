import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardDropService {
  private readonly apiUrl = 'http://192.168.86.43:3692/link-categories';

  constructor(private http: HttpClient) {}

  fetchCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  reorderGroups(categoryId: number, groups: { id: number; position: number }[]) {
    return this.http.post('http://192.168.86.43:3692/link-groups/reorder', {
      categoryId,
      groups
    });
  }

  reorderLinks(links: { id: number; position: number }[]) {
    return this.http.put('http://192.168.86.43:3692/links/reorder', links);
  }

  updateLinkGroup(linkId: number, groupId: number) {
    return this.http.put(`http://192.168.86.43:3692/links/${linkId}`, {
      groupId
    });
  }

  updateGroup(groupId: number, data: any) {
    return this.http.put(`http://192.168.86.43:3692/link-groups/${groupId}`, data);
  }

  deleteLink(linkId: number) {
    return this.http.delete(`http://192.168.86.43:3692/links/${linkId}`);
  }

  deleteGroup(groupId: number) {
    return this.http.delete(`http://192.168.86.43:3692/link-groups/${groupId}`);
  }

  createLinkGroup(payload: { name: string; categoryId: number; position: number }) {
    return this.http.post('http://192.168.86.43:3692/link-groups', payload);
  }

  deleteCategory(categoryId: number) {
    return this.http.delete(`http://192.168.86.43:3692/link-categories/${categoryId}`);
  }

  updateCategory(categoryId: number, data: any) {
    return this.http.put(`http://192.168.86.43:3692/link-categories/${categoryId}`, data);
  }
  
  createCategory(payload: { name: string }) {
    return this.http.post('http://192.168.86.43:3692/link-categories', payload);
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
    return this.http.post('http://192.168.86.43:3692/links', data);
  }

  updateLink(id: number, data: {
    name?: string;
    url?: string;
    icon?: string;
    description?: string;
    groupId?: number | null;
    tags?: string[];
  }) {
    return this.http.put(`http://192.168.86.43:3692/links/${id}`, data);
  }

  reorderCategories(data: { id: number, position: number }[]) {
    return this.http.put('http://192.168.86.43:3692/link-categories/reorder', data);
  }

  reorderLinkGroups(groups: { id: number; position: number }[]) {
    return this.http.post('http://192.168.86.43:3692/link-groups/reorder', groups);
  }

  getAllLinks() {
    return this.http.get<any[]>('http://192.168.86.43:3692/links');
  }

  getFullDashboard(): Observable<any[]> {
    return this.http.get<any[]>(`http://192.168.86.43:3692/link-categories`);
  }
  
}
