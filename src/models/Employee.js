const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
    last_name: { type: String, required: [true, 'Last name is required'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    position: { type: String, required: [true, 'Position is required'], trim: true, maxlength: 100 },
    salary: { type: Number, required: [true, 'Salary is required'], min: [0.01, 'Salary must be positive'] },
    date_of_joining: { type: Date, required: [true, 'Date of joining is required'] },
    department: { type: String, required: [true, 'Department is required'], trim: true, maxlength: 100 },
    // Ownership: reference to the User who created this employee
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee must have an owner'],
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// An owner cannot create two employees with the same email
employeeSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
