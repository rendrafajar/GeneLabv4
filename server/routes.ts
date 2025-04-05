import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertDepartmentSchema, 
  insertClassSchema, 
  insertTeacherSchema,
  insertSubjectSchema,
  insertCurriculumSchema,
  insertRoomSchema,
  insertTimeSlotSchema,
  insertScheduleSchema,
  insertScheduleDetailSchema,
  geneticParamsSchema
} from "@shared/schema";
import { GeneticAlgorithm } from "./genetic-algorithm";
import { WebSocketServer } from "ws";

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Autentikasi diperlukan" });
};

// Middleware to check if user is admin
const ensureAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Akses ditolak" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  
  // Set up WebSocket connections
  setupWebSockets(wss);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Define API routes
  
  // Departments API
  app.get("/api/departments", async (req, res, next) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "Jurusan tidak ditemukan" });
      }
      res.json(department);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/departments", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertDepartmentSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const department = await storage.createDepartment(parsedData.data);
      res.status(201).json(department);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/departments/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertDepartmentSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const department = await storage.updateDepartment(id, parsedData.data);
      if (!department) {
        return res.status(404).json({ message: "Jurusan tidak ditemukan" });
      }
      
      res.json(department);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/departments/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDepartment(id);
      if (!success) {
        return res.status(404).json({ message: "Jurusan tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Classes API
  app.get("/api/classes", async (req, res, next) => {
    try {
      const filters = {
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        academicYear: req.query.academicYear as string | undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };
      
      const classes = await storage.getClasses(filters);
      res.json(classes);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/classes/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const classItem = await storage.getClass(id);
      if (!classItem) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
      res.json(classItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/classes", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertClassSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const classItem = await storage.createClass(parsedData.data);
      res.status(201).json(classItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/classes/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertClassSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const classItem = await storage.updateClass(id, parsedData.data);
      if (!classItem) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
      
      res.json(classItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/classes/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClass(id);
      if (!success) {
        return res.status(404).json({ message: "Kelas tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Teachers API
  app.get("/api/teachers", async (req, res, next) => {
    try {
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };
      
      const teachers = await storage.getTeachers(filters);
      res.json(teachers);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/teachers/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const teacher = await storage.getTeacher(id);
      if (!teacher) {
        return res.status(404).json({ message: "Guru tidak ditemukan" });
      }
      res.json(teacher);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/teachers", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertTeacherSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const teacher = await storage.createTeacher(parsedData.data);
      res.status(201).json(teacher);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/teachers/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertTeacherSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const teacher = await storage.updateTeacher(id, parsedData.data);
      if (!teacher) {
        return res.status(404).json({ message: "Guru tidak ditemukan" });
      }
      
      res.json(teacher);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/teachers/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeacher(id);
      if (!success) {
        return res.status(404).json({ message: "Guru tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Teacher availability
  app.get("/api/teachers/:id/availability", async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      const availability = await storage.getTeacherAvailability(teacherId);
      res.json(availability);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/teachers/:id/availability", ensureAdmin, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      const schema = z.object({
        timeSlotId: z.number().int(),
        isAvailable: z.boolean()
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const availability = await storage.setTeacherAvailability(
        teacherId, 
        parsedData.data.timeSlotId, 
        parsedData.data.isAvailable
      );
      
      res.json(availability);
    } catch (error) {
      next(error);
    }
  });
  
  // Teacher subjects
  app.get("/api/teachers/:id/subjects", async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      const academicYear = req.query.academicYear as string || new Date().getFullYear() + "/" + (new Date().getFullYear() + 1);
      
      const teacherSubjects = await storage.getTeacherSubjects(teacherId, academicYear);
      res.json(teacherSubjects);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/teachers/:id/subjects", ensureAdmin, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.id);
      const schema = z.object({
        subjectId: z.number().int(),
        academicYear: z.string()
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const teacherSubject = await storage.assignTeacherSubject(
        teacherId,
        parsedData.data.subjectId,
        parsedData.data.academicYear
      );
      
      res.json(teacherSubject);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/teacher-subjects/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeTeacherSubject(id);
      if (!success) {
        return res.status(404).json({ message: "Penugasan guru tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Subjects API
  app.get("/api/subjects", async (req, res, next) => {
    try {
      const filters = {
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
      };
      
      const subjects = await storage.getSubjects(filters);
      res.json(subjects);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/subjects/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.getSubject(id);
      if (!subject) {
        return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });
      }
      res.json(subject);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/subjects", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertSubjectSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const subject = await storage.createSubject(parsedData.data);
      res.status(201).json(subject);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/subjects/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertSubjectSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const subject = await storage.updateSubject(id, parsedData.data);
      if (!subject) {
        return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });
      }
      
      res.json(subject);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/subjects/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSubject(id);
      if (!success) {
        return res.status(404).json({ message: "Mata pelajaran tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Curriculum API
  app.get("/api/curriculum", async (req, res, next) => {
    try {
      const filters = {
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        gradeLevel: req.query.gradeLevel ? parseInt(req.query.gradeLevel as string) : undefined,
        academicYear: req.query.academicYear as string | undefined,
      };
      
      const curriculumItems = await storage.getCurriculum(filters);
      res.json(curriculumItems);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/curriculum", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertCurriculumSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const curriculumItem = await storage.createCurriculumItem(parsedData.data);
      res.status(201).json(curriculumItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/curriculum/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertCurriculumSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const curriculumItem = await storage.updateCurriculumItem(id, parsedData.data);
      if (!curriculumItem) {
        return res.status(404).json({ message: "Item kurikulum tidak ditemukan" });
      }
      
      res.json(curriculumItem);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/curriculum/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCurriculumItem(id);
      if (!success) {
        return res.status(404).json({ message: "Item kurikulum tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Rooms API
  app.get("/api/rooms", async (req, res, next) => {
    try {
      const filters = {
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        type: req.query.type as 'teori' | 'praktikum' | undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };
      
      const rooms = await storage.getRooms(filters);
      res.json(rooms);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/rooms/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }
      res.json(room);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/rooms", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertRoomSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const room = await storage.createRoom(parsedData.data);
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/rooms/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertRoomSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const room = await storage.updateRoom(id, parsedData.data);
      if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/rooms/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoom(id);
      if (!success) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Room department constraints
  app.get("/api/rooms/:id/departments", async (req, res, next) => {
    try {
      const roomId = parseInt(req.params.id);
      const roomDepartments = await storage.getRoomDepartments(roomId);
      res.json(roomDepartments);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/rooms/:id/departments", ensureAdmin, async (req, res, next) => {
    try {
      const roomId = parseInt(req.params.id);
      const schema = z.object({
        departmentId: z.number().int()
      });
      
      const parsedData = schema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const roomDepartment = await storage.assignRoomDepartment(
        roomId, 
        parsedData.data.departmentId
      );
      
      res.json(roomDepartment);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/room-departments/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeRoomDepartment(id);
      if (!success) {
        return res.status(404).json({ message: "Batasan ruangan tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Time Slots API
  app.get("/api/time-slots", async (req, res, next) => {
    try {
      const timeSlots = await storage.getTimeSlots();
      res.json(timeSlots);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/time-slots/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const timeSlot = await storage.getTimeSlot(id);
      if (!timeSlot) {
        return res.status(404).json({ message: "Slot waktu tidak ditemukan" });
      }
      res.json(timeSlot);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/time-slots", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertTimeSlotSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const timeSlot = await storage.createTimeSlot(parsedData.data);
      res.status(201).json(timeSlot);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/time-slots/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertTimeSlotSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const timeSlot = await storage.updateTimeSlot(id, parsedData.data);
      if (!timeSlot) {
        return res.status(404).json({ message: "Slot waktu tidak ditemukan" });
      }
      
      res.json(timeSlot);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/time-slots/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTimeSlot(id);
      if (!success) {
        return res.status(404).json({ message: "Slot waktu tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Schedules API
  app.get("/api/schedules", async (req, res, next) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/schedules/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getSchedule(id);
      if (!schedule) {
        return res.status(404).json({ message: "Jadwal tidak ditemukan" });
      }
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/schedules", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertScheduleSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const schedule = await storage.createSchedule({
        ...parsedData.data,
        createdBy: req.user.id
      });
      
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/schedules/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertScheduleSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const schedule = await storage.updateSchedule(id, parsedData.data);
      if (!schedule) {
        return res.status(404).json({ message: "Jadwal tidak ditemukan" });
      }
      
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/schedules/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSchedule(id);
      if (!success) {
        return res.status(404).json({ message: "Jadwal tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Schedule Details API
  app.get("/api/schedules/:id/details", async (req, res, next) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const details = await storage.getScheduleDetails(scheduleId);
      res.json(details);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/schedule-details", ensureAdmin, async (req, res, next) => {
    try {
      const parsedData = insertScheduleDetailSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const detail = await storage.createScheduleDetail({
        ...parsedData.data,
        isManuallyEdited: true
      });
      
      res.status(201).json(detail);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/schedule-details/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertScheduleDetailSchema.partial().safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsedData.error.errors });
      }
      
      const detail = await storage.updateScheduleDetail(id, {
        ...parsedData.data,
        isManuallyEdited: true
      });
      
      if (!detail) {
        return res.status(404).json({ message: "Detail jadwal tidak ditemukan" });
      }
      
      res.json(detail);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/schedule-details/:id", ensureAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteScheduleDetail(id);
      if (!success) {
        return res.status(404).json({ message: "Detail jadwal tidak ditemukan" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Schedule Conflicts API
  app.get("/api/schedules/:id/conflicts", async (req, res, next) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const conflicts = await storage.getScheduleConflicts(scheduleId);
      res.json(conflicts);
    } catch (error) {
      next(error);
    }
  });
  
  // Generate Schedule using genetic algorithm
  app.post("/api/schedules/:id/generate", ensureAdmin, async (req, res, next) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      // Get schedule
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Jadwal tidak ditemukan" });
      }
      
      // Parse genetic algorithm parameters
      const parsedParams = geneticParamsSchema.safeParse(req.body);
      if (!parsedParams.success) {
        return res.status(400).json({ message: "Parameter tidak valid", errors: parsedParams.error.errors });
      }
      
      // Start generation in background and return immediately
      res.status(202).json({ 
        message: "Proses generasi jadwal dimulai",
        scheduleId
      });
      
      // Get all necessary data for the genetic algorithm
      const classes = await storage.getClasses({ academicYear: schedule.academicYear, isActive: true });
      const subjects = await storage.getSubjects();
      const teachers = await storage.getTeachers({ isActive: true });
      const rooms = await storage.getRooms({ isActive: true });
      const timeSlots = await storage.getTimeSlots();
      
      // Get curriculum for these classes
      const departmentIds = [...new Set(classes.map(c => c.departmentId))];
      const curriculum = await storage.getCurriculum({ 
        academicYear: schedule.academicYear,
      });
      
      // Get teacher subjects
      const teacherSubjectsPromises = teachers.map(t => 
        storage.getTeacherSubjects(t.id, schedule.academicYear)
      );
      const teacherSubjectsArrays = await Promise.all(teacherSubjectsPromises);
      const teacherSubjects = teacherSubjectsArrays.flat();
      
      // Get teacher availability
      const teacherAvailabilityPromises = teachers.map(t => 
        storage.getTeacherAvailability(t.id)
      );
      const teacherAvailabilityArrays = await Promise.all(teacherAvailabilityPromises);
      const teacherAvailability = teacherAvailabilityArrays.flat();
      
      // Get room departments
      const roomDepartmentsPromises = rooms.map(r => 
        storage.getRoomDepartments(r.id)
      );
      const roomDepartmentsArrays = await Promise.all(roomDepartmentsPromises);
      const roomDepartments = roomDepartmentsArrays.flat();
      
      // Initialize genetic algorithm
      const ga = new GeneticAlgorithm(parsedParams.data, {
        classes,
        subjects,
        teachers,
        rooms,
        timeSlots,
        curriculum,
        teacherSubjects,
        teacherAvailability,
        roomDepartments
      });
      
      ga.initialize();
      
      // Store GA parameters in the schedule
      await storage.updateSchedule(scheduleId, {
        geneticParams: parsedParams.data,
        status: 'draft'
      });
      
      // Update clients with progress
      const interval = setInterval(async () => {
        const progress = ga.getProgress();
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({
              type: 'scheduleGenerationProgress',
              data: {
                scheduleId,
                ...progress
              }
            }));
          }
        });
        
        if (progress.currentGeneration >= progress.totalGenerations) {
          clearInterval(interval);
          
          // Get the best schedule
          const generatedDetails = ga.getBestSchedule();
          
          // Assign schedule ID to all details
          const detailsWithScheduleId = generatedDetails.map(detail => ({
            ...detail,
            scheduleId
          }));
          
          // Store in database
          const storedDetails = await storage.bulkCreateScheduleDetails(detailsWithScheduleId);
          
          // Update schedule with fitness score
          await storage.updateSchedule(scheduleId, {
            fitnessScore: ga.getBestFitness()
          });
          
          // Notify clients
          wss.clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'scheduleGenerationComplete',
                data: {
                  scheduleId,
                  fitnessScore: ga.getBestFitness(),
                  detailsCount: storedDetails.length
                }
              }));
            }
          });
        }
      }, 1000);
      
      // Run the algorithm in the background
      (async () => {
        while(ga.evolve()) {
          // Small delay to prevent CPU overload
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      })();
      
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}

// Set up WebSocket server for real-time updates
function setupWebSockets(wss: WebSocketServer) {
  wss.on('connection', (ws) => {
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      data: { message: 'Connected to Genelab v4 WebSocket server' }
    }));
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });
}
