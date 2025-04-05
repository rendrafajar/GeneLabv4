import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Home, 
  BookOpen, 
  Users, 
  Building2, 
  GraduationCap, 
  LayoutGrid, 
  Clock, 
  FileText, 
  Edit, 
  BarChart4, 
  AlertTriangle, 
  Calendar, 
  X
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <h1 className="text-lg font-semibold text-gray-900">Genelab v4</h1>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-col flex-grow overflow-y-auto scrollbar-hide">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {/* Admin Menu */}
          {user && user.role === 'admin' && (
            <>
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Dashboard
              </div>
              <Link href="/">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Home className="h-5 w-5 mr-3" />
                  Dashboard
                </a>
              </Link>

              <div className="mt-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Data Master
              </div>
              <Link href="/subjects">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/subjects") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <BookOpen className="h-5 w-5 mr-3" />
                  Mata Pelajaran
                </a>
              </Link>
              <Link href="/curriculum">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/curriculum") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <FileText className="h-5 w-5 mr-3" />
                  Kurikulum
                </a>
              </Link>
              <Link href="/teachers">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/teachers") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Users className="h-5 w-5 mr-3" />
                  Guru
                </a>
              </Link>
              <Link href="/classes">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/classes") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Building2 className="h-5 w-5 mr-3" />
                  Kelas
                </a>
              </Link>
              <Link href="/departments">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/departments") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <GraduationCap className="h-5 w-5 mr-3" />
                  Jurusan
                </a>
              </Link>
              <Link href="/rooms">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/rooms") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <LayoutGrid className="h-5 w-5 mr-3" />
                  Ruangan
                </a>
              </Link>
              <Link href="/timeslots">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/timeslots") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Clock className="h-5 w-5 mr-3" />
                  Slot Waktu
                </a>
              </Link>

              <div className="mt-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Penjadwalan
              </div>
              <Link href="/schedule/generate">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/schedule/generate") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <FileText className="h-5 w-5 mr-3" />
                  Generate Jadwal
                </a>
              </Link>
              <Link href="/schedule/edit">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/schedule/edit") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Edit className="h-5 w-5 mr-3" />
                  Edit Jadwal
                </a>
              </Link>

              <div className="mt-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Laporan
              </div>
              <Link href="/reports/teachers">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/reports/teachers") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <BarChart4 className="h-5 w-5 mr-3" />
                  Beban Mengajar
                </a>
              </Link>
              <Link href="/reports/conflicts">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/reports/conflicts") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <AlertTriangle className="h-5 w-5 mr-3" />
                  Jadwal Bentrok
                </a>
              </Link>
              <Link href="/reports/rooms">
                <a className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive("/reports/rooms") 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Calendar className="h-5 w-5 mr-3" />
                  Penggunaan Ruang
                </a>
              </Link>
            </>
          )}

          {/* Viewer Menu */}
          {user && user.role === 'viewer' && (
            <Link href="/schedule/view">
              <a className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive("/schedule/view") 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <FileText className="h-5 w-5 mr-3" />
                Lihat Jadwal
              </a>
            </Link>
          )}

          {/* Guest Menu (when not logged in) */}
          {!user && (
            <Link href="/schedule/view">
              <a className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive("/schedule/view") 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <FileText className="h-5 w-5 mr-3" />
                Lihat Jadwal
              </a>
            </Link>
          )}
        </nav>
      </div>

      {user && (
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.name || user.username}</p>
              <button 
                onClick={handleLogout}
                className="text-xs font-medium text-gray-500 hover:text-primary-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
