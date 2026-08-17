import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { TimesheetEntry } from '../models/timesheet';
import { Department } from '../models/department';
import { Employee } from '../models/employee';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  private baseUrl = 'http://localhost:3000/api';

  private normalizeEntry(entry: TimesheetEntry): TimesheetEntry {
    const hours = Number(entry.hours ?? 0);
    const rate = Number(entry.payAmount ?? 0);
    const totalPay = Number(entry.totalPay ?? hours * rate);

    return {
      ...entry,
      hours,
      payAmount: rate,
      totalPay,
      departmentId: entry.departmentId ?? '',
      employeeId: (entry as any).employeeId ?? ''
    };
  }

  // local cache for departments and employees (start empty)
  private departments: Department[] = [];
  private employees: Employee[] = [];

  // currently selected department
  selectedDepartment?: Department;
  selectedDepartment$ = new BehaviorSubject<Department | undefined>(undefined);
  private entriesSubject = new BehaviorSubject<TimesheetEntry[]>([]);
  entries$ = this.entriesSubject.asObservable();
  private departmentsSubject = new BehaviorSubject<Department[]>(this.departments);
  departments$ = this.departmentsSubject.asObservable();
  private employeesSubject = new BehaviorSubject<Employee[]>(this.employees);
  employees$ = this.employeesSubject.asObservable();

  constructor(private http: HttpClient) {}

  addEntry(entry: TimesheetEntry): Observable<any> {
    const normalized = this.normalizeEntry(entry);
    const optimisticEntry = this.normalizeEntry({
      ...normalized,
      ...(normalized as any)._id ? { _id: (normalized as any)._id } : { _id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}` }
    } as TimesheetEntry);

    const current = this.entriesSubject.getValue();
    this.entriesSubject.next([optimisticEntry, ...current]);
    this._localAdd(optimisticEntry);

    return this.http.post<TimesheetEntry>(`${this.baseUrl}/entries`, normalized).pipe(
      tap((saved: TimesheetEntry) => {
        const synced = this.normalizeEntry(saved);
        const updated = this.entriesSubject.getValue().map((item: TimesheetEntry) => {
          const itemId = (item as any)._id || (item as any).id;
          const optimisticId = (optimisticEntry as any)._id || (optimisticEntry as any).id;
          return itemId === optimisticId ? synced : item;
        });
        this.entriesSubject.next(updated);

        const localEntries = this._localGetAll();
        (this as any)._entries = localEntries.map((item: TimesheetEntry) => {
          const itemId = (item as any)._id || (item as any).id;
          const optimisticId = (optimisticEntry as any)._id || (optimisticEntry as any).id;
          return itemId === optimisticId ? synced : item;
        });
      }),
      catchError((err: any) => {
        console.error('POST /entries failed, using local fallback', err);
        const currentEntries = this.entriesSubject.getValue();
        const fallback = this.normalizeEntry({
          ...normalized,
          ...(normalized as any)._id ? { _id: (normalized as any)._id } : { _id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}` }
        } as TimesheetEntry);

        this.entriesSubject.next(currentEntries.filter((item: TimesheetEntry) => {
          const itemId = (item as any)._id || (item as any).id;
          const optimisticId = (optimisticEntry as any)._id || (optimisticEntry as any).id;
          return itemId !== optimisticId;
        }));

        const localEntries = this._localGetAll();
        (this as any)._entries = localEntries.filter((item: TimesheetEntry) => {
          const itemId = (item as any)._id || (item as any).id;
          const optimisticId = (optimisticEntry as any)._id || (optimisticEntry as any).id;
          return itemId !== optimisticId;
        });

        this._localAdd(fallback);
        this.entriesSubject.next([fallback, ...this.entriesSubject.getValue()]);
        return of(fallback);
      })
    );
  }

  getAll(): Observable<TimesheetEntry[]> {
    return this.http.get<TimesheetEntry[]>(`${this.baseUrl}/entries`).pipe(
      tap((list: TimesheetEntry[]) => this.entriesSubject.next(list.map(entry => this.normalizeEntry(entry)))),
      catchError((err: any) => {
        console.error('GET /entries failed, returning local cache', err);
        const local = this._localGetAll().map(entry => this.normalizeEntry(entry));
        this.entriesSubject.next(local);
        return of(local);
      })
    );
  }

  updateEntry(id: string, data: Partial<TimesheetEntry>): Observable<any> {
    const normalized = this.normalizeEntry({
      ...(this.entriesSubject.getValue().find((entry: any) => (entry as any)._id === id || (entry as any).id === id) || {}),
      ...data,
      totalPay: Number((Number(data.hours ?? 0) * Number(data.payAmount ?? 0)).toFixed(2))
    } as TimesheetEntry);

    return this.http.put<TimesheetEntry>(`${this.baseUrl}/entries/${id}`, normalized).pipe(
      tap((updated: TimesheetEntry) => {
        const current = this.entriesSubject.getValue();
        const item = this.normalizeEntry(updated);
        this.entriesSubject.next(current.map((entry: TimesheetEntry) => {
          const entryId = (entry as any)._id || (entry as any).id;
          return entryId === id ? item : entry;
        }));
        const localEntries = this._localGetAll();
        (this as any)._entries = localEntries.map((entry: TimesheetEntry) => {
          const entryId = (entry as any)._id || (entry as any).id;
          return entryId === id ? item : entry;
        });
      }),
      catchError((err: any) => {
        console.error('PUT /entries failed, applying local fallback', err);
        const current = this.entriesSubject.getValue();
        const item = this.normalizeEntry({
          ...(current.find((entry: any) => (entry as any)._id === id || (entry as any).id === id) || {}),
          ...data,
          totalPay: Number((Number(data.hours ?? 0) * Number(data.payAmount ?? 0)).toFixed(2))
        } as TimesheetEntry);
        const updatedCurrent = current.map((entry: TimesheetEntry) => {
          const entryId = (entry as any)._id || (entry as any).id;
          return entryId === id ? item : entry;
        });
        this.entriesSubject.next(updatedCurrent);
        const localEntries = this._localGetAll();
        (this as any)._entries = localEntries.map((entry: TimesheetEntry) => {
          const entryId = (entry as any)._id || (entry as any).id;
          return entryId === id ? item : entry;
        });
        return of(item);
      })
    );
  }

  deleteEntry(id: string): Observable<any> {
    const key = id || '';

    const removeFromLocal = () => {
      const localEntries = this._localGetAll();
      const updatedLocal = localEntries.filter((entry: TimesheetEntry) => {
        const entryId = (entry as any)._id || (entry as any).id;
        return entryId !== key;
      });
      (this as any)._entries = updatedLocal;
    };

    return this.http.delete(`${this.baseUrl}/entries/${key}`).pipe(
      tap(() => {
        const current = this.entriesSubject.getValue();
        const updated = current.filter((entry: TimesheetEntry) => {
          const entryId = (entry as any)._id || (entry as any).id;
          return entryId !== key;
        });
        this.entriesSubject.next(updated);
        removeFromLocal();
      }),
      catchError((err: any) => {
        console.error('DELETE /entries failed, applying local fallback', err);
        const current = this.entriesSubject.getValue();
        const updated = current.filter((entry: TimesheetEntry) => {
          const entryId = (entry as any)._id || (entry as any).id;
          return entryId !== key;
        });
        this.entriesSubject.next(updated);
        removeFromLocal();
        return of(null);
      })
    );
  }

  private _localAdd(entry: TimesheetEntry) {
    const normalized = this.normalizeEntry(entry);
    (this._localGetAll() as TimesheetEntry[]).unshift(normalized);
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

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`).pipe(
      tap((list: Employee[]) => this.employeesSubject.next(list)),
      catchError((err: any) => {
        console.error('GET /employees failed, returning local list', err);
        this.employeesSubject.next(this.employees);
        return of(this.employees);
      })
    );
  }

  addEmployee(emp: Partial<Employee>): Observable<any> {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, emp).pipe(
      tap((saved: Employee) => {
        const current = this.employeesSubject.getValue();
        this.employeesSubject.next([saved, ...current]);
      }),
      catchError((err: any) => {
        console.error('POST /employees failed, using local fallback', err);
        const local: Employee = { _id: Math.random().toString(36).slice(2), ...emp } as Employee;
        const current = this.employeesSubject.getValue();
        this.employeesSubject.next([local, ...current]);
        return of(local);
      })
    );
  }

  updateEmployee(id: string, data: Partial<Employee>): Observable<any> {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${id}`, data).pipe(
      tap((updated: Employee) => {
        const current = this.employeesSubject.getValue();
        this.employeesSubject.next(current.map((e: Employee) => (e._id === updated._id ? updated : e)));
      }),
      catchError((err: any) => {
        console.error('PUT /employees failed', err);
        return of(null);
      })
    );
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`).pipe(
      tap(() => {
        const current = this.employeesSubject.getValue();
        this.employeesSubject.next(current.filter((e: Employee) => (e._id || e.id) !== id));
      }),
      catchError((err: any) => {
        console.error('DELETE /employees failed, applying local fallback', err);
        const current = this.employeesSubject.getValue();
        this.employeesSubject.next(current.filter((e: Employee) => (e._id || e.id) !== id));
        return of(null);
      })
    );
  }
}
