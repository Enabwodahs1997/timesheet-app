import { Component, OnInit } from '@angular/core';
import { TimesheetService } from '../../services/timesheet.service';
import { Employee } from '../../models/employee';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EmployeeListComponent implements OnInit {
  newName = '';
  editingId?: string;
  editName = '';

  constructor(public service: TimesheetService) {}

  ngOnInit() {
    this.service.getEmployees().subscribe();
  }

  add() {
    if (!this.newName.trim()) return;
    this.service.addEmployee({ name: this.newName.trim() } as any).subscribe(() => {
      this.newName = '';
    });
  }

  startEdit(emp: Employee) {
    this.editingId = emp._id || emp.id;
    this.editName = emp.name;
  }

  saveEdit(emp: Employee) {
    const id = emp._id || emp.id;
    if (!id) return;
    this.service.updateEmployee(id, { name: this.editName }).subscribe(() => {
      this.editingId = undefined;
    });
  }

  cancelEdit() {
    this.editingId = undefined;
  }

  delete(emp: Employee) {
    const id = emp._id || emp.id;
    if (!id) return;
    this.service.deleteEmployee(id).subscribe();
  }
}
