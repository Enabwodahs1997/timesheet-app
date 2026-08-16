import { Component, OnInit } from '@angular/core';
import { TimesheetService } from '../../services/timesheet.service';
import { Department } from '../../models/department';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-department-list',
  templateUrl: './department-list.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DepartmentListComponent implements OnInit {
  newName = '';
  editingId?: string;
  editName = '';

  constructor(public service: TimesheetService) {}

  ngOnInit() {
    this.service.getDepartments().subscribe();
  }

  select(dept: Department) {
    this.service.setSelectedDepartment(dept);
  }

  add() {
    if (!this.newName.trim()) return;
    this.service.addDepartment({ name: this.newName.trim() } as any).subscribe(() => {
      this.newName = '';
    });
  }

  startEdit(d: Department) {
    this.editingId = d._id || d.id;
    this.editName = d.name;
  }

  saveEdit(d: Department) {
    const id = d._id || d.id;
    if (!id) return;
    this.service.updateDepartment(id, { name: this.editName }).subscribe(() => {
      this.editingId = undefined;
    });
  }

  cancelEdit() {
    this.editingId = undefined;
  }

  delete(d: Department) {
    const id = d._id || d.id;
    if (!id) return;
    this.service.deleteDepartment(id).subscribe();
  }
}
