import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Schedule } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList, Edit, FileText } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch schedules
  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  // Fetch departments count
  const { data: departments, isLoading: departmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  // Fetch teachers count
  const { data: teachers, isLoading: teachersLoading } = useQuery<any[]>({
    queryKey: ['/api/teachers'],
  });

  // Fetch classes count
  const { data: classes, isLoading: classesLoading } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  // Fetch rooms count
  const { data: rooms, isLoading: roomsLoading } = useQuery<any[]>({
    queryKey: ['/api/rooms'],
  });

  // Get latest schedules
  const latestSchedules = schedules 
    ? [...schedules].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5) 
    : [];

  // Format status as badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aktif':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'arsip':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <section className="space-y-6">
      {/* Welcome and summary */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="relative bg-primary-600 py-8 px-6">
          <h2 className="text-lg font-semibold text-white">Selamat Datang di Genelab v4</h2>
          <p className="mt-1 text-sm text-primary-100">
            Sistem Penjadwalan Pelajaran SMK Otomatis dengan Algoritma Genetika
          </p>
          <div className="absolute right-0 bottom-0 transform translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary-500 opacity-20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zM11 5h2v4h-2zm0 10h2v4h-2z"/>
            </svg>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 bg-accent-100 rounded-md p-3">
                <ClipboardList className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Guru</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {teachersLoading ? "..." : teachers?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Kelas</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {classesLoading ? "..." : classes?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 bg-secondary-100 rounded-md p-3">
                <FileText className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Jurusan</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {departmentsLoading ? "..." : departments?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Ruangan</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {roomsLoading ? "..." : rooms?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Admin only */}
      {user?.role === 'admin' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/schedule/generate">
              <a className="group block p-6 border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-200 transition-colors">
                <div className="flex justify-center items-center h-16 w-16 mx-auto bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="mt-4 text-base font-medium text-gray-900 text-center">Generate Jadwal</h3>
                <p className="mt-1 text-sm text-gray-500 text-center">Buat jadwal baru dengan algoritma genetika</p>
              </a>
            </Link>
            <Link href="/schedule/edit">
              <a className="group block p-6 border border-gray-200 rounded-lg hover:bg-secondary-50 hover:border-secondary-200 transition-colors">
                <div className="flex justify-center items-center h-16 w-16 mx-auto bg-secondary-100 rounded-lg group-hover:bg-secondary-200 transition-colors">
                  <Edit className="h-8 w-8 text-secondary-600" />
                </div>
                <h3 className="mt-4 text-base font-medium text-gray-900 text-center">Edit Jadwal</h3>
                <p className="mt-1 text-sm text-gray-500 text-center">Sesuaikan jadwal dengan drag and drop</p>
              </a>
            </Link>
            <Link href="/departments">
              <a className="group block p-6 border border-gray-200 rounded-lg hover:bg-accent-50 hover:border-accent-200 transition-colors">
                <div className="flex justify-center items-center h-16 w-16 mx-auto bg-accent-100 rounded-lg group-hover:bg-accent-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-medium text-gray-900 text-center">Manajemen Data</h3>
                <p className="mt-1 text-sm text-gray-500 text-center">Kelola guru, kelas, dan ruangan</p>
              </a>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Schedules */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Jadwal Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Jadwal
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tahun Ajaran
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dibuat
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schedulesLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            Memuat jadwal...
                          </td>
                        </tr>
                      ) : latestSchedules.length > 0 ? (
                        latestSchedules.map((schedule) => (
                          <tr key={schedule.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{schedule.academicYear}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(schedule.status)}`}>
                                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(schedule.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link href={`/schedule/view/${schedule.id}`}>
                                <a className="text-primary-600 hover:text-primary-900 mr-3">Lihat</a>
                              </Link>
                              {user?.role === 'admin' && (
                                <>
                                  <Link href={`/schedule/edit/${schedule.id}`}>
                                    <a className="text-primary-600 hover:text-primary-900 mr-3">Edit</a>
                                  </Link>
                                  <button className="text-red-600 hover:text-red-900">Hapus</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            Belum ada jadwal yang dibuat
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="outline">
                <Link href="/schedule/generate">
                  <a>Buat Jadwal Baru</a>
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default Dashboard;
