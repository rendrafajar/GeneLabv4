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
import AppShell from "@/components/layout/app-shell";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/schedule/view/:id">
        {params => <ViewSchedule scheduleId={parseInt(params.id)} />}
      </Route>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/schedule/generate" component={GenerateSchedule} />
      <ProtectedRoute path="/schedule/edit/:id">
        {params => <EditSchedule scheduleId={parseInt(params.id)} />}
      </ProtectedRoute>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell>
          <Router />
        </AppShell>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
