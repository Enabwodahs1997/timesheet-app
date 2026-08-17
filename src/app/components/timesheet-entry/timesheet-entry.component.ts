import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimesheetService } from '../../services/timesheet.service';
import { TimesheetEntry } from '../../models/timesheet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timesheet-entry',
  templateUrl: './timesheet-entry.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TimesheetEntryComponent implements OnInit, OnDestroy {
  entry: TimesheetEntry = { date: '', hours: 0, payAmount: 0, totalPay: 0, departmentId: '', employeeId: '' };
  isSaving = false;
  private sub?: Subscription;

  constructor(public service: TimesheetService) {}

  get totalPay(): number {
    return this.entry.hours * this.entry.payAmount;
  }

  ngOnInit() {
    this.service.getDepartments().subscribe();
    this.service.getEmployees().subscribe();

    const sel = this.service.getSelectedDepartment();
    if (sel) {
      this.entry.departmentId = sel._id || sel.id || '';
    }
    this.sub = this.service.selectedDepartment$.subscribe(d => {
      if (d) this.entry.departmentId = d._id || d.id || '';
    });
  }

  save() {
    if (this.isSaving) {
      return;
    }

    if (!this.entry.date || !this.entry.departmentId || !this.entry.employeeId || this.entry.hours <= 0 || this.entry.payAmount < 0) {
      return;
    }

    const entryToSave: TimesheetEntry = {
      ...this.entry,
      totalPay: this.entry.hours * this.entry.payAmount
    };

    this.isSaving = true;
    this.service.addEntry(entryToSave).subscribe({
      next: () => {
        this.entry = { date: '', hours: 0, payAmount: 0, totalPay: 0, departmentId: '', employeeId: '' };
      },
      error: () => {
        this.entry = { date: '', hours: 0, payAmount: 0, totalPay: 0, departmentId: '', employeeId: '' };
      },
      complete: () => {
        this.isSaving = false;
      }
    });

    this.entry = { date: '', hours: 0, payAmount: 0, totalPay: 0, departmentId: '', employeeId: '' };
    this.isSaving = false;
  }
  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
