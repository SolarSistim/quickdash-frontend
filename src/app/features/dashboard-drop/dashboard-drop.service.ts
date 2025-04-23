import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardDropService {
  private readonly apiUrl = 'http://localhost:3692/link-categories';

  constructor(private http: HttpClient) {}

  fetchCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  reorderGroups(categoryId: number, groups: { id: number; position: number }[]) {
    return this.http.post('http://localhost:3692/link-groups/reorder', {
      categoryId,
      groups
    });
  }

  reorderLinks(links: { id: number; position: number }[]) {
    return this.http.put('http://localhost:3692/links/reorder', links);
  }

  updateLinkGroup(linkId: number, groupId: number) {
    return this.http.put(`http://localhost:3692/links/${linkId}`, {
      groupId
    });
  }

  updateGroup(groupId: number, data: any) {
    return this.http.put(`http://localhost:3692/link-groups/${groupId}`, data);
  }

  deleteLink(linkId: number) {
    return this.http.delete(`http://localhost:3692/links/${linkId}`);
  }

  deleteGroup(groupId: number) {
    return this.http.delete(`http://localhost:3692/link-groups/${groupId}`);
  }

  createLinkGroup(payload: { name: string; categoryId: number; position: number }) {
    return this.http.post('http://localhost:3692/link-groups', payload);
  }
  
}
