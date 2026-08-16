import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { TimesheetEntry } from '../models/timesheet';
import { Department } from '../models/department';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private baseUrl = 'http://localhost:3000/api';

  // local cache for departments (start empty)
  private departments: Department[] = [];

  // currently selected department
  selectedDepartment?: Department;
  selectedDepartment$ = new BehaviorSubject<Department | undefined>(undefined);
  private entriesSubject = new BehaviorSubject<TimesheetEntry[]>([]);
  entries$ = this.entriesSubject.asObservable();
  private departmentsSubject = new BehaviorSubject<Department[]>(this.departments);
  departments$ = this.departmentsSubject.asObservable();

  constructor(private http: HttpClient) {}

  addEntry(entry: TimesheetEntry): Observable<any> {
    return this.http.post<TimesheetEntry>(`${this.baseUrl}/entries`, entry).pipe(
      tap((saved: TimesheetEntry) => {
        // update entries observable
        const current = this.entriesSubject.getValue();
        this.entriesSubject.next([saved, ...current]);
      }),
      catchError((err: any) => {
        // fallback to local store if backend fails
        console.error('POST /entries failed, using local fallback', err);
        this._localAdd(entry);
        // update entries observable with fallback entry
        const current = this.entriesSubject.getValue();
        this.entriesSubject.next([entry, ...current]);
        return of(entry);
      })
    );
  }

  getAll(): Observable<TimesheetEntry[]> {
    return this.http.get<TimesheetEntry[]>(`${this.baseUrl}/entries`).pipe(
      tap((list: TimesheetEntry[]) => this.entriesSubject.next(list)),
      catchError((err: any) => {
        console.error('GET /entries failed, returning local cache', err);
        const local = this._localGetAll();
        this.entriesSubject.next(local);
        return of(local);
      })
    );
  }

  private _localAdd(entry: TimesheetEntry) {
    // simple in-memory fallback
    (this._localGetAll() as TimesheetEntry[]).unshift(entry as any);
  }

  private _localGetAll(): TimesheetEntry[] {
    // ensure we have an in-memory array attached to service
    if (!(this as any)._entries) (this as any)._entries = [];
    return (this as any)._entries;
  }

  setSelectedDepartment(dept: Department) {
    this.selectedDepartment = dept;
    this.selectedDepartment$.next(dept);
  }

  getSelectedDepartment(): Department | undefined {
    return this.selectedDepartment;
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/departments`).pipe(
      tap((list: Department[]) => this.departmentsSubject.next(list)),
      catchError((err: any) => {
        console.error('GET /departments failed, returning local list', err);
        this.departmentsSubject.next(this.departments);
        return of(this.departments);
      })
    );
  }

  addDepartment(dept: Partial<Department>): Observable<any> {
    return this.http.post<Department>(`${this.baseUrl}/departments`, dept).pipe(
      tap((saved: Department) => {
        const current = this.departmentsSubject.getValue();
        this.departmentsSubject.next([saved, ...current]);
      }),
      catchError((err: any) => {
        console.error('POST /departments failed, using local fallback', err);
        const local: Department = { _id: Math.random().toString(36).slice(2), ...dept } as Department;
        const current = this.departmentsSubject.getValue();
        this.departmentsSubject.next([local, ...current]);
        return of(local);
      })
    );
  }

  updateDepartment(id: string, data: Partial<Department>): Observable<any> {
    return this.http.put<Department>(`${this.baseUrl}/departments/${id}`, data).pipe(
      tap((updated: Department) => {
        const current = this.departmentsSubject.getValue();
        this.departmentsSubject.next(current.map((d: Department) => (d._id === updated._id ? updated : d)));
      }),
      catchError((err: any) => {
        console.error('PUT /departments failed', err);
        return of(null);
      })
    );
  }

  deleteDepartment(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/departments/${id}`).pipe(
      tap(() => {
        const current = this.departmentsSubject.getValue();
        this.departmentsSubject.next(current.filter((d: Department) => (d._id || d.id) !== id));
      }),
      catchError((err: any) => {
        console.error('DELETE /departments failed, applying local fallback', err);
        // remove locally so UI responds even if backend is down
        const current = this.departmentsSubject.getValue();
        this.departmentsSubject.next(current.filter((d: Department) => (d._id || d.id) !== id));
        return of(null);
      })
    );
  }
}
