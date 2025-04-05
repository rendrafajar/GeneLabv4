import { db } from "./db";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

import {
  users,
  type User,
  type InsertUser,
  departments,
  type Department,
  type InsertDepartment,
  classes,
  type Class,
  type InsertClass,
  teachers,
  type Teacher,
  type InsertTeacher,
  subjects,
  type Subject,
  type InsertSubject,
  curriculum,
  type Curriculum,
  type InsertCurriculum,
  rooms,
  type Room,
  type InsertRoom,
  timeSlots,
  type TimeSlot,
  type InsertTimeSlot,
  teacherAvailability,
  type TeacherAvailability,
  type InsertTeacherAvailability,
  teacherSubjects,
  type TeacherSubject,
  type InsertTeacherSubject,
  roomDepartments,
  type RoomDepartment,
  type InsertRoomDepartment,
  schedules,
  type Schedule,
  type InsertSchedule,
  scheduleDetails,
  type ScheduleDetail,
  type InsertScheduleDetail,
  scheduleConflicts,
  type ScheduleConflict,
  type InsertScheduleConflict,
} from "@shared/schema";

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Department methods
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Class methods
  getClasses(filters?: { departmentId?: number, academicYear?: string, isActive?: boolean }): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  
  // Teacher methods
  getTeachers(filters?: { isActive?: boolean }): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;
  
  // Subject methods
  getSubjects(filters?: { departmentId?: number, gradeLevel?: number }): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  
  // Curriculum methods
  getCurriculum(filters?: { departmentId?: number, gradeLevel?: number, academicYear?: string }): Promise<Curriculum[]>;
  getCurriculumItem(id: number): Promise<Curriculum | undefined>;
  createCurriculumItem(curriculumItem: InsertCurriculum): Promise<Curriculum>;
  updateCurriculumItem(id: number, curriculumItem: Partial<InsertCurriculum>): Promise<Curriculum | undefined>;
  deleteCurriculumItem(id: number): Promise<boolean>;
  
  // Room methods
  getRooms(filters?: { departmentId?: number, type?: 'teori' | 'praktikum', isActive?: boolean }): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  
  // TimeSlot methods
  getTimeSlots(): Promise<TimeSlot[]>;
  getTimeSlot(id: number): Promise<TimeSlot | undefined>;
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  updateTimeSlot(id: number, timeSlot: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined>;
  deleteTimeSlot(id: number): Promise<boolean>;
  
  // Teacher availability methods
  getTeacherAvailability(teacherId: number): Promise<TeacherAvailability[]>;
  setTeacherAvailability(teacherId: number, timeSlotId: number, isAvailable: boolean): Promise<TeacherAvailability>;
  
  // Teacher subjects methods
  getTeacherSubjects(teacherId: number, academicYear: string): Promise<TeacherSubject[]>;
  assignTeacherSubject(teacherId: number, subjectId: number, academicYear: string): Promise<TeacherSubject>;
  removeTeacherSubject(id: number): Promise<boolean>;
  
  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Schedule details methods
  getScheduleDetails(scheduleId: number): Promise<ScheduleDetail[]>;
  getScheduleDetail(id: number): Promise<ScheduleDetail | undefined>;
  createScheduleDetail(detail: InsertScheduleDetail): Promise<ScheduleDetail>;
  updateScheduleDetail(id: number, detail: Partial<InsertScheduleDetail>): Promise<ScheduleDetail | undefined>;
  deleteScheduleDetail(id: number): Promise<boolean>;
  bulkCreateScheduleDetails(details: InsertScheduleDetail[]): Promise<ScheduleDetail[]>;
  
  // Schedule conflicts methods
  getScheduleConflicts(scheduleId: number): Promise<ScheduleConflict[]>;
  createScheduleConflict(conflict: InsertScheduleConflict): Promise<ScheduleConflict>;
  
  // Room department constraints
  getRoomDepartments(roomId: number): Promise<RoomDepartment[]>;
  assignRoomDepartment(roomId: number, departmentId: number): Promise<RoomDepartment>;
  removeRoomDepartment(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Initialize session store with PostgreSQL connection
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL || 
          `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`,
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(departmentData: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(departmentData).returning();
    return department;
  }

  async updateDepartment(id: number, departmentData: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updated] = await db.update(departments)
      .set(departmentData)
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id));
    return result.rowCount > 0;
  }

  // Class methods
  async getClasses(filters?: { departmentId?: number, academicYear?: string, isActive?: boolean }): Promise<Class[]> {
    let query = db.select().from(classes);
    
    if (filters) {
      if (filters.departmentId !== undefined) {
        query = query.where(eq(classes.departmentId, filters.departmentId));
      }
      if (filters.academicYear !== undefined) {
        query = query.where(eq(classes.academicYear, filters.academicYear));
      }
      if (filters.isActive !== undefined) {
        query = query.where(eq(classes.isActive, filters.isActive));
      }
    }
    
    return await query;
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [created] = await db.insert(classes).values(classData).returning();
    return created;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const [updated] = await db.update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.rowCount > 0;
  }

  // Teacher methods
  async getTeachers(filters?: { isActive?: boolean }): Promise<Teacher[]> {
    let query = db.select().from(teachers);
    
    if (filters && filters.isActive !== undefined) {
      query = query.where(eq(teachers.isActive, filters.isActive));
    }
    
    return await query;
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [created] = await db.insert(teachers).values(teacherData).returning();
    return created;
  }

  async updateTeacher(id: number, teacherData: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [updated] = await db.update(teachers)
      .set(teacherData)
      .where(eq(teachers.id, id))
      .returning();
    return updated;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id));
    return result.rowCount > 0;
  }

  // Subject methods
  async getSubjects(filters?: { departmentId?: number, gradeLevel?: number }): Promise<Subject[]> {
    let query = db.select().from(subjects);
    
    if (filters) {
      if (filters.departmentId !== undefined) {
        query = query.where(eq(subjects.departmentId, filters.departmentId));
      }
      if (filters.gradeLevel !== undefined) {
        query = query.where(eq(subjects.gradeLevel, filters.gradeLevel));
      }
    }
    
    return await query;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [created] = await db.insert(subjects).values(subjectData).returning();
    return created;
  }

  async updateSubject(id: number, subjectData: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [updated] = await db.update(subjects)
      .set(subjectData)
      .where(eq(subjects.id, id))
      .returning();
    return updated;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(subjects).where(eq(subjects.id, id));
    return result.rowCount > 0;
  }

  // Curriculum methods
  async getCurriculum(filters?: { departmentId?: number, gradeLevel?: number, academicYear?: string }): Promise<Curriculum[]> {
    let query = db.select().from(curriculum);
    
    if (filters) {
      if (filters.departmentId !== undefined) {
        query = query.where(eq(curriculum.departmentId, filters.departmentId));
      }
      if (filters.gradeLevel !== undefined) {
        query = query.where(eq(curriculum.gradeLevel, filters.gradeLevel));
      }
      if (filters.academicYear !== undefined) {
        query = query.where(eq(curriculum.academicYear, filters.academicYear));
      }
    }
    
    return await query;
  }

  async getCurriculumItem(id: number): Promise<Curriculum | undefined> {
    const [item] = await db.select().from(curriculum).where(eq(curriculum.id, id));
    return item;
  }

  async createCurriculumItem(curriculumData: InsertCurriculum): Promise<Curriculum> {
    const [created] = await db.insert(curriculum).values(curriculumData).returning();
    return created;
  }

  async updateCurriculumItem(id: number, curriculumData: Partial<InsertCurriculum>): Promise<Curriculum | undefined> {
    const [updated] = await db.update(curriculum)
      .set(curriculumData)
      .where(eq(curriculum.id, id))
      .returning();
    return updated;
  }

  async deleteCurriculumItem(id: number): Promise<boolean> {
    const result = await db.delete(curriculum).where(eq(curriculum.id, id));
    return result.rowCount > 0;
  }

  // Room methods
  async getRooms(filters?: { departmentId?: number, type?: 'teori' | 'praktikum', isActive?: boolean }): Promise<Room[]> {
    let query = db.select().from(rooms);
    
    if (filters) {
      if (filters.departmentId !== undefined) {
        query = query.where(eq(rooms.departmentId, filters.departmentId));
      }
      if (filters.type !== undefined) {
        query = query.where(eq(rooms.type, filters.type));
      }
      if (filters.isActive !== undefined) {
        query = query.where(eq(rooms.isActive, filters.isActive));
      }
    }
    
    return await query;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(roomData: InsertRoom): Promise<Room> {
    const [created] = await db.insert(rooms).values(roomData).returning();
    return created;
  }

  async updateRoom(id: number, roomData: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updated] = await db.update(rooms)
      .set(roomData)
      .where(eq(rooms.id, id))
      .returning();
    return updated;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  // TimeSlot methods
  async getTimeSlots(): Promise<TimeSlot[]> {
    return await db.select().from(timeSlots).orderBy(timeSlots.dayOfWeek, timeSlots.slotNumber);
  }

  async getTimeSlot(id: number): Promise<TimeSlot | undefined> {
    const [slot] = await db.select().from(timeSlots).where(eq(timeSlots.id, id));
    return slot;
  }

  async createTimeSlot(timeSlotData: InsertTimeSlot): Promise<TimeSlot> {
    const [created] = await db.insert(timeSlots).values(timeSlotData).returning();
    return created;
  }

  async updateTimeSlot(id: number, timeSlotData: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const [updated] = await db.update(timeSlots)
      .set(timeSlotData)
      .where(eq(timeSlots.id, id))
      .returning();
    return updated;
  }

  async deleteTimeSlot(id: number): Promise<boolean> {
    const result = await db.delete(timeSlots).where(eq(timeSlots.id, id));
    return result.rowCount > 0;
  }

  // Teacher availability methods
  async getTeacherAvailability(teacherId: number): Promise<TeacherAvailability[]> {
    return await db.select().from(teacherAvailability)
      .where(eq(teacherAvailability.teacherId, teacherId));
  }

  async setTeacherAvailability(teacherId: number, timeSlotId: number, isAvailable: boolean): Promise<TeacherAvailability> {
    // Try to update first
    const [existing] = await db.select().from(teacherAvailability)
      .where(and(
        eq(teacherAvailability.teacherId, teacherId),
        eq(teacherAvailability.timeSlotId, timeSlotId)
      ));
    
    if (existing) {
      const [updated] = await db.update(teacherAvailability)
        .set({ isAvailable })
        .where(eq(teacherAvailability.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new if not exists
      const [created] = await db.insert(teacherAvailability)
        .values({ teacherId, timeSlotId, isAvailable })
        .returning();
      return created;
    }
  }

  // Teacher subjects methods
  async getTeacherSubjects(teacherId: number, academicYear: string): Promise<TeacherSubject[]> {
    return await db.select().from(teacherSubjects)
      .where(and(
        eq(teacherSubjects.teacherId, teacherId),
        eq(teacherSubjects.academicYear, academicYear)
      ));
  }

  async assignTeacherSubject(teacherId: number, subjectId: number, academicYear: string): Promise<TeacherSubject> {
    const [created] = await db.insert(teacherSubjects)
      .values({ teacherId, subjectId, academicYear })
      .returning();
    return created;
  }

  async removeTeacherSubject(id: number): Promise<boolean> {
    const result = await db.delete(teacherSubjects).where(eq(teacherSubjects.id, id));
    return result.rowCount > 0;
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).orderBy(schedules.createdAt);
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }

  async createSchedule(scheduleData: InsertSchedule): Promise<Schedule> {
    const [created] = await db.insert(schedules)
      .values({
        ...scheduleData,
        updatedAt: new Date()
      })
      .returning();
    return created;
  }

  async updateSchedule(id: number, scheduleData: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [updated] = await db.update(schedules)
      .set({
        ...scheduleData,
        updatedAt: new Date()
      })
      .where(eq(schedules.id, id))
      .returning();
    return updated;
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db.delete(schedules).where(eq(schedules.id, id));
    return result.rowCount > 0;
  }

  // Schedule details methods
  async getScheduleDetails(scheduleId: number): Promise<ScheduleDetail[]> {
    return await db.select().from(scheduleDetails)
      .where(eq(scheduleDetails.scheduleId, scheduleId));
  }
  
  async getScheduleDetail(id: number): Promise<ScheduleDetail | undefined> {
    const [detail] = await db.select().from(scheduleDetails).where(eq(scheduleDetails.id, id));
    return detail;
  }

  async createScheduleDetail(detailData: InsertScheduleDetail): Promise<ScheduleDetail> {
    const [created] = await db.insert(scheduleDetails).values(detailData).returning();
    return created;
  }

  async updateScheduleDetail(id: number, detailData: Partial<InsertScheduleDetail>): Promise<ScheduleDetail | undefined> {
    const [updated] = await db.update(scheduleDetails)
      .set(detailData)
      .where(eq(scheduleDetails.id, id))
      .returning();
    return updated;
  }

  async deleteScheduleDetail(id: number): Promise<boolean> {
    const result = await db.delete(scheduleDetails).where(eq(scheduleDetails.id, id));
    return result.rowCount > 0;
  }

  async bulkCreateScheduleDetails(details: InsertScheduleDetail[]): Promise<ScheduleDetail[]> {
    if (details.length === 0) return [];
    return await db.insert(scheduleDetails).values(details).returning();
  }

  // Schedule conflicts methods
  async getScheduleConflicts(scheduleId: number): Promise<ScheduleConflict[]> {
    return await db.select().from(scheduleConflicts)
      .where(eq(scheduleConflicts.scheduleId, scheduleId));
  }

  async createScheduleConflict(conflictData: InsertScheduleConflict): Promise<ScheduleConflict> {
    const [created] = await db.insert(scheduleConflicts).values(conflictData).returning();
    return created;
  }

  // Room department constraints
  async getRoomDepartments(roomId: number): Promise<RoomDepartment[]> {
    return await db.select().from(roomDepartments)
      .where(eq(roomDepartments.roomId, roomId));
  }

  async assignRoomDepartment(roomId: number, departmentId: number): Promise<RoomDepartment> {
    const [created] = await db.insert(roomDepartments)
      .values({ roomId, departmentId })
      .returning();
    return created;
  }

  async removeRoomDepartment(id: number): Promise<boolean> {
    const result = await db.delete(roomDepartments).where(eq(roomDepartments.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
