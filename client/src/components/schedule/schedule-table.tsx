import React, { useState } from 'react';
import { ScheduleDetail, TimeSlot } from '@shared/schema';
import { cn } from '@/lib/utils';

interface ScheduleTableProps {
  scheduleDetails: ScheduleDetail[];
  timeSlots: TimeSlot[];
  classId?: number;
  teacherId?: number;
  roomId?: number;
  readOnly?: boolean;
  onDrop?: (detail: ScheduleDetail, timeSlotId: number) => void;
}

interface LessonDisplay {
  id: number;
  subject: string;
  teacher: string;
  room: string;
  className: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

// Map day number to name
const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

// Color variants for different subjects
const colorVariants = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
  { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
];

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  scheduleDetails,
  timeSlots,
  classId,
  teacherId,
  roomId,
  readOnly = true,
  onDrop
}) => {
  const [draggedDetailId, setDraggedDetailId] = useState<number | null>(null);

  // Filter time slots by day and sort by slot number
  const getTimeSlotsForDay = (day: number) => {
    return timeSlots
      .filter(slot => slot.dayOfWeek === day)
      .sort((a, b) => a.slotNumber - b.slotNumber);
  };

  // Get all days used in current time slots
  const getDays = () => {
    const days = new Set<number>();
    timeSlots.forEach(slot => days.add(slot.dayOfWeek));
    return Array.from(days).sort();
  };

  // Get schedule details for a specific time slot
  const getDetailsForTimeSlot = (timeSlotId: number) => {
    return scheduleDetails.filter(detail => {
      let match = detail.timeSlotId === timeSlotId;
      
      if (classId) {
        match = match && detail.classId === classId;
      }
      
      if (teacherId) {
        match = match && detail.teacherId === teacherId;
      }
      
      if (roomId) {
        match = match && detail.roomId === roomId;
      }
      
      return match;
    });
  };

  // Format time (e.g., "08:00:00" to "08:00")
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  // Handle drag start
  const handleDragStart = (detailId: number) => {
    if (readOnly) return;
    setDraggedDetailId(detailId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, timeSlotId: number) => {
    if (readOnly || !draggedDetailId || !onDrop) return;
    
    e.preventDefault();
    
    const detail = scheduleDetails.find(d => d.id === draggedDetailId);
    if (detail) {
      onDrop(detail, timeSlotId);
    }
    
    setDraggedDetailId(null);
  };

  // Prevent leaving the drag area
  const handleDragEnd = () => {
    setDraggedDetailId(null);
  };

  // Get color for a subject based on subject ID
  const getColorForSubject = (subjectId: number) => {
    const colorIndex = subjectId % colorVariants.length;
    return colorVariants[colorIndex];
  };

  // Days of the week
  const days = getDays();

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Jam</th>
                {days.map(day => (
                  <th key={day} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    {dayNames[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {days.length > 0 && getTimeSlotsForDay(days[0]).map(timeSlot => (
                <tr key={timeSlot.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                  </td>
                  
                  {days.map(day => {
                    const currentTimeSlot = timeSlots.find(
                      ts => ts.dayOfWeek === day && ts.slotNumber === timeSlot.slotNumber
                    );
                    
                    if (!currentTimeSlot) return (
                      <td key={`empty-${day}-${timeSlot.slotNumber}`} className="whitespace-nowrap px-3 py-4 text-sm">
                        -
                      </td>
                    );
                    
                    const detailsForSlot = getDetailsForTimeSlot(currentTimeSlot.id);
                    
                    return (
                      <td 
                        key={`${day}-${timeSlot.slotNumber}`} 
                        className="whitespace-nowrap px-3 py-4 text-sm"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, currentTimeSlot.id)}
                      >
                        {detailsForSlot.length > 0 ? (
                          detailsForSlot.map(detail => {
                            const colors = getColorForSubject(detail.subjectId);
                            
                            return (
                              <div 
                                key={detail.id}
                                className={cn(
                                  "p-2 border rounded mb-1",
                                  colors.bg,
                                  colors.border,
                                  draggedDetailId === detail.id ? "opacity-50" : ""
                                )}
                                draggable={!readOnly}
                                onDragStart={() => handleDragStart(detail.id)}
                                onDragEnd={handleDragEnd}
                              >
                                <div className={cn("font-medium", colors.text)}>
                                  {detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`}
                                </div>
                                <div className={cn("text-xs", colors.text.replace("800", "600"))}>
                                  {detail.teacher?.name || `Guru ${detail.teacherId}`}
                                </div>
                                <div className={cn("text-xs", colors.text.replace("800", "500"))}>
                                  {detail.room?.name || `Ruang ${detail.roomId}`}
                                </div>
                                {!classId && (
                                  <div className={cn("text-xs font-bold mt-1", colors.text)}>
                                    {detail.class?.name || `Kelas ${detail.classId}`}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className={cn(
                            "p-2 min-h-[60px] border border-dashed border-gray-300 rounded",
                            !readOnly && "dropzone"
                          )}>
                            {!readOnly && <span className="text-gray-400 text-xs">Drop disini</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTable;
