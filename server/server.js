require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timesheet';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const entrySchema = new mongoose.Schema({
  date: String,
  hours: Number,
  payAmount: Number,
  totalPay: Number,
  departmentId: String,
  employeeId: String
}, { timestamps: true });

const Entry = mongoose.model('Entry', entrySchema);

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

app.get('/api/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }).lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch entries' });
  }
});

app.post('/api/entries', async (req, res) => {
  try {
    const e = new Entry(req.body);
    const saved = await e.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'failed to save entry' });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  try {
    const updated = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'failed to update entry' });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  try {
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to delete entry' });
  }
});

// Departments CRUD
app.get('/api/departments', async (req, res) => {
  try {
    const depts = await Department.find().sort({ name: 1 }).lean();
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch departments' });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    const d = new Department(req.body);
    const saved = await d.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'failed to save department' });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'failed to update department' });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to delete department' });
  }
});

// Employees CRUD
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 }).lean();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    const saved = await employee.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'failed to save employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'failed to update employee' });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'failed to delete employee' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
