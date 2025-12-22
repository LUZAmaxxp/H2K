import mongoose from 'mongoose';

// ============================================================================
// PHYSIOTHERAPY APPOINTMENT SYSTEM MODELS
// Hôpital Hassan II - Physiotherapy Department
// ============================================================================

// User Profile Schema (extends Better Auth user with role and professional info)
const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User' // Reference to BetterAuth User
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: true,
    enum: ['therapist', 'admin'],
    default: 'therapist'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
    default: 'pending'
  },
  // Therapist-specific fields
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    sparse: true // Only required for therapists
  },
  specialization: {
    type: String,
    sparse: true
  },
  phoneNumber: {
    type: String,
    sparse: true
  },
  lastLogin: {
    type: Date
  },
  totalAppointments: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Patient Schema
const PatientSchema = new mongoose.Schema({
  medicalRecordNumber: {
    type: String,
    required: true,
    unique: true
    // Note: unique: true automatically creates an index, no need for index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  insuranceProvider: {
    type: String
  },
  insuranceNumber: {
    type: String
  },
  primaryTherapist: {
    type: String,
    ref: 'UserProfile'
  },
  medicalNotes: {
    type: String
  },
  allergies: [{
    type: String
  }],
  appointmentHistory: [{
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    date: {
      type: Date,
      required: true
    },
    therapist: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  therapistId: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  therapistName: {
    type: String,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true // Format: "HH:MM" (e.g., "08:00", "14:30")
  },
  duration: {
    type: Number,
    required: true, // Duration in minutes
    enum: [30, 45, 60]
  },
  appointmentType: {
    type: String,
    required: true,
    enum: ['initial-assessment', 'follow-up', 'rehabilitation', 'post-operative']
  },
  room: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'no-show', 'cancelled'],
    default: 'pending'
  },
  medicalNotes: {
    type: String
  },
  specialRequirements: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Waiting List Schema
const WaitingListSchema = new mongoose.Schema({
  therapistId: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  desiredDate: {
    type: Date,
    required: true
  },
  desiredTime: {
    type: String,
    required: true
  },
  appointmentType: {
    type: String,
    required: true,
    enum: ['initial-assessment', 'follow-up', 'rehabilitation', 'post-operative']
  },
  duration: {
    type: Number,
    required: true,
    enum: [30, 45, 60]
  },
  priorityNumber: {
    type: Number,
    required: true
  },
  roomPreference: {
    type: String
  },
  notes: {
    type: String
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

// Room Schema
const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    default: 1
  },
  equipment: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Audit Log Schema (for role changes and important actions)
const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['role_change', 'user_approval', 'user_rejection', 'appointment_created', 'appointment_cancelled', 'waiting_list_promoted']
  },
  performedBy: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  targetUserId: {
    type: String,
    ref: 'UserProfile'
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// User Settings Schema (kept for backward compatibility)
const UserSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User',
    unique: true
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: false
    },
    weeklyReports: {
      type: Boolean,
      default: true
    }
  },
  appearance: {
    darkMode: {
      type: Boolean,
      default: false
    },
    compactView: {
      type: Boolean,
      default: false
    }
  },
  language: {
    type: String,
    default: 'en-US'
  },
  timezone: {
    type: String,
    default: 'UTC-5'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for performance
AppointmentSchema.index({ therapistId: 1, date: 1 });
AppointmentSchema.index({ date: 1, time: 1, room: 1 });
AppointmentSchema.index({ patientId: 1 });
WaitingListSchema.index({ therapistId: 1, desiredDate: 1, priorityNumber: 1 });
// Note: medicalRecordNumber index is already defined in schema above, don't duplicate
PatientSchema.index({ phoneNumber: 1 });

// Create models if they don't exist
export const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);
export const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
export const WaitingList = mongoose.models.WaitingList || mongoose.model('WaitingList', WaitingListSchema);
export const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export const UserSettings = mongoose.models.UserSettings || mongoose.model('UserSettings', UserSettingsSchema);

// Type definitions
export interface IUserProfile {
  _id: string;
  userId: string;
  email: string;
  role: 'therapist' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  specialization?: string;
  phoneNumber?: string;
  lastLogin?: Date;
  totalAppointments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatient {
  _id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  email?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  primaryTherapist?: string;
  medicalNotes?: string;
  allergies?: string[];
  appointmentHistory: Array<{
    appointmentId: string;
    date: Date;
    therapist: string;
    type: string;
    status: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment {
  _id: string;
  therapistId: string;
  therapistName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: Date;
  time: string;
  duration: 30 | 45 | 60;
  appointmentType: 'initial-assessment' | 'follow-up' | 'rehabilitation' | 'post-operative';
  room: string;
  status: 'pending' | 'completed' | 'no-show' | 'cancelled';
  medicalNotes?: string;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWaitingList {
  _id: string;
  therapistId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  desiredDate: Date;
  desiredTime: string;
  appointmentType: 'initial-assessment' | 'follow-up' | 'rehabilitation' | 'post-operative';
  duration: 30 | 45 | 60;
  priorityNumber: number;
  roomPreference?: string;
  notes?: string;
  dateAdded: Date;
}

export interface IRoom {
  _id: string;
  name: string;
  capacity: number;
  equipment: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface IAuditLog {
  _id: string;
  action: 'role_change' | 'user_approval' | 'user_rejection' | 'appointment_created' | 'appointment_cancelled' | 'waiting_list_promoted';
  performedBy: string;
  targetUserId?: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface IUserSettings {
  _id: string;
  userId: string;
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
  };
  appearance: {
    darkMode: boolean;
    compactView: boolean;
  };
  language: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}
