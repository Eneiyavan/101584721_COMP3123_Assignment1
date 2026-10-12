const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Only these fields can be set by the client. "user" is NEVER taken from the body.
const ALLOWED = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];
const pick = (obj) => Object.fromEntries(ALLOWED.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

/**
 * Loads an employee and enforces ownership.
 *  - 404 if it does not exist
 *  - 403 if it exists but belongs to another user
 */
const getOwnedEmployee = async (eid, userId) => {
  const employee = await Employee.findById(eid);
  if (!employee) throw new AppError('Employee not found', 404);
  if (String(employee.user) !== String(userId)) {
    throw new AppError('Forbidden: this employee belongs to another user', 403);
  }
  return employee;
};

// GET /api/v1/emp/employees -> 200 (only the caller's employees)
exports.getAll = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ user: req.user._id }).sort({ created_at: -1 });
  logger.info('Employees listed', { userId: String(req.user._id), count: employees.length });
  res.status(200).json({ status: 'success', count: employees.length, data: employees });
});

// POST /api/v1/emp/employees -> 201 (owner = authenticated user)
exports.create = asyncHandler(async (req, res) => {
  const employee = await Employee.create({ ...pick(req.body), user: req.user._id });
  logger.info('Employee created', { userId: String(req.user._id), employeeId: String(employee._id) });
  res.status(201).json({ status: 'success', message: 'Employee created successfully', data: employee });
});

// GET /api/v1/emp/employees/:eid -> 200
exports.getById = asyncHandler(async (req, res) => {
  const employee = await getOwnedEmployee(req.params.eid, req.user._id);
  res.status(200).json({ status: 'success', data: employee });
});

// PUT /api/v1/emp/employees/:eid -> 200
exports.update = asyncHandler(async (req, res) => {
  await getOwnedEmployee(req.params.eid, req.user._id);
  // The filter includes user again so ownership is enforced in the query itself
  const updated = await Employee.findOneAndUpdate(
    { _id: req.params.eid, user: req.user._id },
    { $set: pick(req.body) },
    { new: true, runValidators: true }
  );
  if (!updated) throw new AppError('Employee not found', 404);
  logger.info('Employee updated', { userId: String(req.user._id), employeeId: String(updated._id) });
  res.status(200).json({ status: 'success', message: 'Employee updated successfully', data: updated });
});

// DELETE /api/v1/emp/employees?eid=xxx -> 204
exports.remove = asyncHandler(async (req, res) => {
  await getOwnedEmployee(req.query.eid, req.user._id);
  const result = await Employee.deleteOne({ _id: req.query.eid, user: req.user._id });
  if (result.deletedCount === 0) throw new AppError('Employee not found', 404);
  logger.info('Employee deleted', { userId: String(req.user._id), employeeId: req.query.eid });
  res.status(204).send();
});
