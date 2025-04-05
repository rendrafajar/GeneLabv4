import { pgTable, text, serial, integer, boolean, timestamp, json, unique, foreignKey, time, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'viewer']);
export const roomTypeEnum = pgEnum('room_type', ['teori', 'praktikum']);
export const scheduleStatusEnum = pgEnum('schedule_status', ['draft', 'aktif', 'arsip']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default('viewer'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments/Jurusan table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

// Classes/Kelas table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gradeLevel: integer("grade_level").notNull(), // 10, 11, 12 for X, XI, XII
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Teachers/Guru table
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Kode guru
  specialization: text("specialization"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
});

// Subjects/Mata Pelajaran table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  gradeLevel: integer("grade_level"), // Optional: specific grade level
  departmentId: integer("department_id").references(() => departments.id), // Optional: specific department
  roomType: roomTypeEnum("room_type").notNull().default('teori'), // Type of room needed
  description: text("description"),
});

// Curriculum table linking subjects to grade levels and departments
export const curriculum = pgTable("curriculum", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  gradeLevel: integer("grade_level").notNull(),
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
  hoursPerWeek: integer("hours_per_week").notNull(),
  academicYear: text("academic_year").notNull(),
}, (t) => ({
  uniq: unique().on(t.subjectId, t.gradeLevel, t.departmentId, t.academicYear),
}));

// Room/Ruangan table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  type: roomTypeEnum("type").notNull(),
  capacity: integer("capacity").notNull(),
  departmentId: integer("department_id").references(() => departments.id), // Optional: specific department
  isActive: boolean("is_active").notNull().default(true),
});

// Time slots table
export const timeSlots = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-5 for Monday-Friday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  slotNumber: integer("slot_number").notNull(), // Ordinal number of the slot in the day
}, (t) => ({
  uniq: unique().on(t.dayOfWeek, t.slotNumber),
}));

// Teacher availability table
export const teacherAvailability = pgTable("teacher_availability", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  timeSlotId: integer("time_slot_id").notNull().references(() => timeSlots.id, { onDelete: 'cascade' }),
  isAvailable: boolean("is_available").notNull().default(true),
}, (t) => ({
  uniq: unique().on(t.teacherId, t.timeSlotId),
}));

// Teacher subject assignment
export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  academicYear: text("academic_year").notNull(),
}, (t) => ({
  uniq: unique().on(t.teacherId, t.subjectId, t.academicYear),
}));

// Room constraints for departments
export const roomDepartments = pgTable("room_departments", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  departmentId: integer("department_id").notNull().references(() => departments.id, { onDelete: 'cascade' }),
}, (t) => ({
  uniq: unique().on(t.roomId, t.departmentId),
}));

// Schedule header table
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  status: scheduleStatusEnum("status").notNull().default('draft'),
  geneticParams: json("genetic_params"), // Store GA parameters used
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at"),
  fitnessScore: integer("fitness_score"),
});

// Schedule details table
export const scheduleDetails = pgTable("schedule_details", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  classId: integer("class_id").notNull().references(() => classes.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  timeSlotId: integer("time_slot_id").notNull().references(() => timeSlots.id),
  isManuallyEdited: boolean("is_manually_edited").default(false),
  isOverride: boolean("is_override").default(false), // For marking exceptions
});

// Schedule conflicts for reporting
export const scheduleConflicts = pgTable("schedule_conflicts", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  conflictType: text("conflict_type").notNull(), // 'teacher', 'room', 'class'
  description: text("description").notNull(),
  detailId1: integer("detail_id_1").notNull().references(() => scheduleDetails.id),
  detailId2: integer("detail_id_2").notNull().references(() => scheduleDetails.id),
  severity: text("severity").notNull(), // 'hard', 'soft'
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  schedules: many(schedules),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  classes: many(classes),
  curriculum: many(curriculum),
  roomDepartments: many(roomDepartments),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  department: one(departments, {
    fields: [classes.departmentId],
    references: [departments.id],
  }),
  scheduleDetails: many(scheduleDetails),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  availability: many(teacherAvailability),
  subjects: many(teacherSubjects),
  scheduleDetails: many(scheduleDetails),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  department: one(departments, {
    fields: [subjects.departmentId],
    references: [departments.id],
  }),
  curriculum: many(curriculum),
  teacherSubjects: many(teacherSubjects),
  scheduleDetails: many(scheduleDetails),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  department: one(departments, {
    fields: [rooms.departmentId],
    references: [departments.id],
  }),
  roomDepartments: many(roomDepartments),
  scheduleDetails: many(scheduleDetails),
}));

export const timeSlotsRelations = relations(timeSlots, ({ many }) => ({
  teacherAvailability: many(teacherAvailability),
  scheduleDetails: many(scheduleDetails),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  creator: one(users, {
    fields: [schedules.createdBy],
    references: [users.id],
  }),
  details: many(scheduleDetails),
  conflicts: many(scheduleConflicts),
}));

export const scheduleDetailsRelations = relations(scheduleDetails, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [scheduleDetails.scheduleId],
    references: [schedules.id],
  }),
  class: one(classes, {
    fields: [scheduleDetails.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [scheduleDetails.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [scheduleDetails.teacherId],
    references: [teachers.id],
  }),
  room: one(rooms, {
    fields: [scheduleDetails.roomId],
    references: [rooms.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [scheduleDetails.timeSlotId],
    references: [timeSlots.id],
  }),
  conflictsA: many(scheduleConflicts, { relationName: "conflict_a" }),
  conflictsB: many(scheduleConflicts, { relationName: "conflict_b" }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertDepartmentSchema = createInsertSchema(departments);
export const insertClassSchema = createInsertSchema(classes);
export const insertTeacherSchema = createInsertSchema(teachers);
export const insertSubjectSchema = createInsertSchema(subjects);
export const insertCurriculumSchema = createInsertSchema(curriculum);
export const insertRoomSchema = createInsertSchema(rooms);
export const insertTimeSlotSchema = createInsertSchema(timeSlots);
export const insertTeacherAvailabilitySchema = createInsertSchema(teacherAvailability);
export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects);
export const insertRoomDepartmentSchema = createInsertSchema(roomDepartments);
export const insertScheduleSchema = createInsertSchema(schedules).omit({ createdAt: true, updatedAt: true });
export const insertScheduleDetailSchema = createInsertSchema(scheduleDetails);
export const insertScheduleConflictSchema = createInsertSchema(scheduleConflicts);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Curriculum = typeof curriculum.$inferSelect;
export type InsertCurriculum = z.infer<typeof insertCurriculumSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;

export type TeacherAvailability = typeof teacherAvailability.$inferSelect;
export type InsertTeacherAvailability = z.infer<typeof insertTeacherAvailabilitySchema>;

export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;

export type RoomDepartment = typeof roomDepartments.$inferSelect;
export type InsertRoomDepartment = z.infer<typeof insertRoomDepartmentSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type ScheduleDetail = typeof scheduleDetails.$inferSelect;
export type InsertScheduleDetail = z.infer<typeof insertScheduleDetailSchema>;

export type ScheduleConflict = typeof scheduleConflicts.$inferSelect;
export type InsertScheduleConflict = z.infer<typeof insertScheduleConflictSchema>;

// Additional schemas for business logic
export const geneticParamsSchema = z.object({
  populationSize: z.number().min(10).max(1000).default(100),
  generationCount: z.number().min(10).max(1000).default(100),
  elitismCount: z.number().min(1).max(50).default(5),
  crossoverRate: z.number().min(0).max(1).default(0.8),
  mutationRate: z.number().min(0).max(1).default(0.2),
  tournamentSize: z.number().min(2).max(50).default(5),
  hardConstraints: z.object({
    teacherConflict: z.boolean().default(true),
    classConflict: z.boolean().default(true),
    roomTypeMatch: z.boolean().default(true),
  }),
  softConstraints: z.object({
    teacherPreference: z.boolean().default(true),
    workloadDistribution: z.boolean().default(true),
  })
});

export type GeneticParams = z.infer<typeof geneticParamsSchema>;
