import React, { useState } from 'react';
import { Subject, Teacher, Room } from '@shared/schema';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DraggableLessonProps {
  subject: Subject;
  teacher: Teacher;
  room?: Room;
  onRemove?: () => void;
  className?: string;
  draggable?: boolean;
}

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

const DraggableLessonCard: React.FC<DraggableLessonProps> = ({
  subject,
  teacher,
  room,
  onRemove,
  className,
  draggable = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Get color based on subject ID
  const getColorVariant = () => {
    const colorIndex = subject.id % colorVariants.length;
    return colorVariants[colorIndex];
  };
  
  const colors = getColorVariant();
  
  // Handlers for drag operations
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggable) return;
    
    setIsDragging(true);
    
    // Set transfer data
    e.dataTransfer.setData('application/json', JSON.stringify({
      subjectId: subject.id,
      teacherId: teacher.id,
      roomId: room?.id
    }));
    
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={cn(
        "p-2 border rounded relative cursor-move",
        colors.bg,
        colors.border,
        isDragging ? "opacity-50" : "",
        className
      )}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("font-medium", colors.text)}>
        {subject.name}
      </div>
      <div className={cn("text-xs", colors.text.replace("800", "600"))}>
        {teacher.name}
      </div>
      {room && (
        <div className={cn("text-xs", colors.text.replace("800", "500"))}>
          {room.name}
        </div>
      )}
      
      {onRemove && (
        <button 
          className="absolute top-1 right-1 text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
          onClick={onRemove}
          aria-label="Hapus"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default DraggableLessonCard;
