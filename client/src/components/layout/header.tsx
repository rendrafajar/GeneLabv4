import { useLocation } from 'wouter';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type HeaderProps = {
  onOpenSidebar: () => void;
};

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/schedule/generate': 'Generate Jadwal',
  '/schedule/edit': 'Edit Jadwal',
  '/schedule/view': 'Lihat Jadwal',
  '/curriculum': 'Kurikulum',
  '/teachers': 'Guru',
  '/classes': 'Kelas',
  '/departments': 'Jurusan',
  '/rooms': 'Ruangan',
  '/timeslots': 'Slot Waktu',
  '/reports/teachers': 'Laporan Beban Mengajar',
  '/reports/conflicts': 'Laporan Jadwal Bentrok',
  '/reports/rooms': 'Laporan Penggunaan Ruang',
  '/auth': 'Login'
};

const Header = ({ onOpenSidebar }: HeaderProps) => {
  const [location] = useLocation();
  const { user } = useAuth();

  // Function to determine the current page title
  const getPageTitle = () => {
    // Check exact matches first
    if (TITLES[location]) return TITLES[location];
    
    // Check for pattern matches
    if (location.startsWith('/schedule/view/')) return 'Lihat Jadwal';
    if (location.startsWith('/schedule/edit/')) return 'Edit Jadwal';
    
    // Default title
    return 'Genelab v4';
  };

  return (
    <header className="z-10 py-4 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center flex-shrink-0 space-x-2">
          <button 
            onClick={onOpenSidebar} 
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Notifikasi">
                <Bell className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
