import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ViewSchedule from "@/pages/view-schedule";
import EditSchedule from "@/pages/edit-schedule";
import GenerateSchedule from "@/pages/generate-schedule";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";
import AppShell from "@/components/layout/app-shell";

// Data Management Pages
import CurriculumPage from "@/pages/master/curriculum";
import TeachersPage from "@/pages/master/teachers";
import ClassesPage from "@/pages/master/classes";
import DepartmentsPage from "@/pages/master/departments";
import RoomsPage from "@/pages/master/rooms";
import TimeSlotsPage from "@/pages/master/timeslots";
import SubjectsPage from "@/pages/master/subjects";
import SubjectCurriculumPage from "@/pages/master/subject-curriculum-management";

// Report Pages
import TeacherWorkloadPage from "@/pages/reports/teacher-workload";
import ScheduleConflictsPage from "@/pages/reports/schedule-conflicts";
import RoomUsagePage from "@/pages/reports/room-usage";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/schedule/view">
        <ViewSchedule />
      </Route>
      <Route path="/schedule/view/:id">
        {params => <ViewSchedule scheduleId={parseInt(params.id)} />}
      </Route>
      
      {/* Protected Routes - Dashboard */}
      <ProtectedRoute path="/" component={Dashboard} />
      
      {/* Protected Routes - Master Data Management */}
      <ProtectedRoute path="/curriculum" component={CurriculumPage} />
      <ProtectedRoute path="/teachers" component={TeachersPage} />
      <ProtectedRoute path="/classes" component={ClassesPage} />
      <ProtectedRoute path="/departments" component={DepartmentsPage} />
      <ProtectedRoute path="/rooms" component={RoomsPage} />
      <ProtectedRoute path="/timeslots" component={TimeSlotsPage} />
      <ProtectedRoute path="/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/subjects-and-curriculum" component={SubjectCurriculumPage} />
      
      {/* Protected Routes - Schedule Management */}
      <ProtectedRoute path="/schedule/generate" component={GenerateSchedule} />
      <ProtectedRoute path="/schedule/edit" component={EditSchedule} />
      <ProtectedRoute path="/schedule/edit/:id">
        {(params: Record<string, string>) => <EditSchedule scheduleId={parseInt(params.id)} />}
      </ProtectedRoute>
      
      {/* Protected Routes - Reports */}
      <ProtectedRoute path="/reports/teachers" component={TeacherWorkloadPage} />
      <ProtectedRoute path="/reports/conflicts" component={ScheduleConflictsPage} />
      <ProtectedRoute path="/reports/rooms" component={RoomUsagePage} />
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <AppShell>
            <Router />
          </AppShell>
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
