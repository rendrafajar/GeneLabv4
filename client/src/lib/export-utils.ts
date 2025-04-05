import { utils, WorkBook, write } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { TimeSlot, ScheduleDetail } from '@shared/schema';

// Format time
const formatTime = (timeString: string) => {
  return timeString.substring(0, 5);
};

// Map day number to name
const getDayName = (dayNumber: number): string => {
  const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  return dayNames[dayNumber] || '';
};

// Prepare data for Excel export
export const prepareScheduleDataForExcel = (
  scheduleDetails: ScheduleDetail[],
  timeSlots: TimeSlot[],
  title: string
) => {
  // Group time slots by day
  const timeSlotsByDay = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  // Sort time slots by slot number within each day
  Object.keys(timeSlotsByDay).forEach(dayKey => {
    const day = parseInt(dayKey);
    timeSlotsByDay[day].sort((a, b) => a.slotNumber - b.slotNumber);
  });

  // Create worksheets for different views
  const workbook: WorkBook = utils.book_new();

  // Create class schedule worksheets
  const classIds = [...new Set(scheduleDetails.map(detail => detail.classId))];
  
  classIds.forEach(classId => {
    const classDetails = scheduleDetails.filter(detail => detail.classId === classId);
    const className = classDetails[0]?.class?.name || `Kelas ${classId}`;
    
    // Create data for the worksheet
    const wsData = [
      ['Jadwal Kelas: ' + className],
      ['Jam', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    ];
    
    // Add rows for each time slot
    const days = Object.keys(timeSlotsByDay).map(Number).sort();
    if (days.length > 0) {
      timeSlotsByDay[days[0]].forEach(timeSlot => {
        const row = [
          `${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}`
        ];
        
        days.forEach(day => {
          const daySlot = timeSlotsByDay[day].find(ts => ts.slotNumber === timeSlot.slotNumber);
          if (!daySlot) {
            row.push('');
            return;
          }
          
          const detail = classDetails.find(d => d.timeSlotId === daySlot.id);
          if (detail) {
            const subjectName = detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`;
            const teacherName = detail.teacher?.name || `Guru ${detail.teacherId}`;
            const roomName = detail.room?.name || `Ruang ${detail.roomId}`;
            row.push(`${subjectName}\n${teacherName}\n${roomName}`);
          } else {
            row.push('');
          }
        });
        
        wsData.push(row);
      });
    }
    
    const ws = utils.aoa_to_sheet(wsData);
    utils.book_append_sheet(workbook, ws, className);
  });

  // Create teacher schedule worksheets
  const teacherIds = [...new Set(scheduleDetails.map(detail => detail.teacherId))];
  
  teacherIds.forEach(teacherId => {
    const teacherDetails = scheduleDetails.filter(detail => detail.teacherId === teacherId);
    const teacherName = teacherDetails[0]?.teacher?.name || `Guru ${teacherId}`;
    
    // Create data for the worksheet
    const wsData = [
      ['Jadwal Guru: ' + teacherName],
      ['Jam', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    ];
    
    // Add rows for each time slot
    const days = Object.keys(timeSlotsByDay).map(Number).sort();
    if (days.length > 0) {
      timeSlotsByDay[days[0]].forEach(timeSlot => {
        const row = [
          `${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}`
        ];
        
        days.forEach(day => {
          const daySlot = timeSlotsByDay[day].find(ts => ts.slotNumber === timeSlot.slotNumber);
          if (!daySlot) {
            row.push('');
            return;
          }
          
          const detail = teacherDetails.find(d => d.timeSlotId === daySlot.id);
          if (detail) {
            const subjectName = detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`;
            const className = detail.class?.name || `Kelas ${detail.classId}`;
            const roomName = detail.room?.name || `Ruang ${detail.roomId}`;
            row.push(`${subjectName}\n${className}\n${roomName}`);
          } else {
            row.push('');
          }
        });
        
        wsData.push(row);
      });
    }
    
    const ws = utils.aoa_to_sheet(wsData);
    utils.book_append_sheet(workbook, ws, teacherName);
  });

  // Create room schedule worksheets
  const roomIds = [...new Set(scheduleDetails.map(detail => detail.roomId))];
  
  roomIds.forEach(roomId => {
    const roomDetails = scheduleDetails.filter(detail => detail.roomId === roomId);
    const roomName = roomDetails[0]?.room?.name || `Ruang ${roomId}`;
    
    // Create data for the worksheet
    const wsData = [
      ['Jadwal Ruangan: ' + roomName],
      ['Jam', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
    ];
    
    // Add rows for each time slot
    const days = Object.keys(timeSlotsByDay).map(Number).sort();
    if (days.length > 0) {
      timeSlotsByDay[days[0]].forEach(timeSlot => {
        const row = [
          `${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}`
        ];
        
        days.forEach(day => {
          const daySlot = timeSlotsByDay[day].find(ts => ts.slotNumber === timeSlot.slotNumber);
          if (!daySlot) {
            row.push('');
            return;
          }
          
          const detail = roomDetails.find(d => d.timeSlotId === daySlot.id);
          if (detail) {
            const subjectName = detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`;
            const teacherName = detail.teacher?.name || `Guru ${detail.teacherId}`;
            const className = detail.class?.name || `Kelas ${detail.classId}`;
            row.push(`${subjectName}\n${className}\n${teacherName}`);
          } else {
            row.push('');
          }
        });
        
        wsData.push(row);
      });
    }
    
    const ws = utils.aoa_to_sheet(wsData);
    utils.book_append_sheet(workbook, ws, roomName);
  });

  // Create a complete schedule worksheet
  const wsData = [
    ['Jadwal Lengkap: ' + title],
    ['Kelas', 'Hari', 'Jam', 'Mata Pelajaran', 'Guru', 'Ruangan']
  ];

  scheduleDetails.forEach(detail => {
    const className = detail.class?.name || `Kelas ${detail.classId}`;
    const timeSlot = timeSlots.find(ts => ts.id === detail.timeSlotId);
    const dayName = timeSlot ? getDayName(timeSlot.dayOfWeek) : '';
    const timeRange = timeSlot 
      ? `${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}`
      : '';
    const subjectName = detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`;
    const teacherName = detail.teacher?.name || `Guru ${detail.teacherId}`;
    const roomName = detail.room?.name || `Ruang ${detail.roomId}`;
    
    wsData.push([className, dayName, timeRange, subjectName, teacherName, roomName]);
  });

  const ws = utils.aoa_to_sheet(wsData);
  utils.book_append_sheet(workbook, ws, 'Jadwal Lengkap');

  return workbook;
};

// Export to Excel
export const exportToExcel = (
  scheduleDetails: ScheduleDetail[],
  timeSlots: TimeSlot[],
  title: string
) => {
  const workbook = prepareScheduleDataForExcel(scheduleDetails, timeSlots, title);
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.xlsx`;
  a.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

// Export to PDF
export const exportToPDF = (
  scheduleDetails: ScheduleDetail[],
  timeSlots: TimeSlot[],
  title: string,
  viewType: 'class' | 'teacher' | 'room' = 'class',
  id?: number
) => {
  try {
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Filter data based on view type and ID
    let filteredDetails = [...scheduleDetails];
    let subtitle = 'Jadwal Lengkap';
    
    if (viewType === 'class' && id) {
      filteredDetails = scheduleDetails.filter(detail => detail.classId === id);
      const className = filteredDetails[0]?.class?.name || `Kelas ${id}`;
      subtitle = `Jadwal Kelas: ${className}`;
    } else if (viewType === 'teacher' && id) {
      filteredDetails = scheduleDetails.filter(detail => detail.teacherId === id);
      const teacherName = filteredDetails[0]?.teacher?.name || `Guru ${id}`;
      subtitle = `Jadwal Guru: ${teacherName}`;
    } else if (viewType === 'room' && id) {
      filteredDetails = scheduleDetails.filter(detail => detail.roomId === id);
      const roomName = filteredDetails[0]?.room?.name || `Ruang ${id}`;
      subtitle = `Jadwal Ruangan: ${roomName}`;
    }
    
    // Add subtitle
    doc.setFontSize(14);
    doc.text(subtitle, 14, 30);
  
  // Group time slots by day
  const timeSlotsByDay = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  // Sort time slots by slot number within each day
  Object.keys(timeSlotsByDay).forEach(dayKey => {
    const day = parseInt(dayKey);
    timeSlotsByDay[day].sort((a, b) => a.slotNumber - b.slotNumber);
  });
  
  // Prepare data for table
  const days = Object.keys(timeSlotsByDay).map(Number).sort();
  
  if (days.length > 0) {
    const tableData: string[][] = [];
    
    timeSlotsByDay[days[0]].forEach(timeSlot => {
      const row: string[] = [
        `${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}`
      ];
      
      days.forEach(day => {
        const daySlot = timeSlotsByDay[day].find(ts => ts.slotNumber === timeSlot.slotNumber);
        if (!daySlot) {
          row.push('');
          return;
        }
        
        let detail;
        if (viewType === 'class' && id) {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        } else if (viewType === 'teacher' && id) {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        } else if (viewType === 'room' && id) {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        } else {
          // For complete schedule, just show first entry for this timeslot (or empty cell)
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        }
        
        if (detail) {
          const subjectName = detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`;
          const teacherName = detail.teacher?.name || `Guru ${detail.teacherId}`;
          const roomName = detail.room?.name || `Ruang ${detail.roomId}`;
          const className = detail.class?.name || `Kelas ${detail.classId}`;
          
          let cellContent = '';
          
          if (viewType === 'class') {
            cellContent = `${subjectName}\n${teacherName}\n${roomName}`;
          } else if (viewType === 'teacher') {
            cellContent = `${subjectName}\n${className}\n${roomName}`;
          } else if (viewType === 'room') {
            cellContent = `${subjectName}\n${className}\n${teacherName}`;
          } else {
            cellContent = `${className}\n${subjectName}\n${teacherName}`;
          }
          
          row.push(cellContent);
        } else {
          row.push('');
        }
      });
      
      tableData.push(row);
    });
    
    // Generate table
    (doc as any).autoTable({
      startY: 40,
      head: [['Jam', ...days.map(day => getDayName(day))]],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Time column
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      didDrawPage: (data: any) => {
        // Add footer with page numbers
        const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}`;
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        doc.text(str, pageSize.width - 20, pageSize.height - 10);
      }
    });
  }
  
  // Save PDF
  doc.save(`${title.replace(/\s+/g, '_')}_${subtitle.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Create fallback alert
    alert('Terjadi kesalahan saat membuat PDF. Silahkan coba lagi nanti.');
  }
};

// Print schedule
export const printSchedule = (
  scheduleDetails: ScheduleDetail[],
  timeSlots: TimeSlot[],
  title: string,
  viewType: 'class' | 'teacher' | 'room' = 'class',
  id?: number
) => {
  // Create a temporary iframe to handle printing
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  // Filter data based on view type and ID
  let filteredDetails = [...scheduleDetails];
  let subtitle = 'Jadwal Lengkap';
  
  if (viewType === 'class' && id) {
    filteredDetails = scheduleDetails.filter(detail => detail.classId === id);
    const className = filteredDetails[0]?.class?.name || `Kelas ${id}`;
    subtitle = `Jadwal Kelas: ${className}`;
  } else if (viewType === 'teacher' && id) {
    filteredDetails = scheduleDetails.filter(detail => detail.teacherId === id);
    const teacherName = filteredDetails[0]?.teacher?.name || `Guru ${id}`;
    subtitle = `Jadwal Guru: ${teacherName}`;
  } else if (viewType === 'room' && id) {
    filteredDetails = scheduleDetails.filter(detail => detail.roomId === id);
    const roomName = filteredDetails[0]?.room?.name || `Ruang ${id}`;
    subtitle = `Jadwal Ruangan: ${roomName}`;
  }

  // Group time slots by day
  const timeSlotsByDay = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  // Sort time slots by slot number within each day
  Object.keys(timeSlotsByDay).forEach(dayKey => {
    const day = parseInt(dayKey);
    timeSlotsByDay[day].sort((a, b) => a.slotNumber - b.slotNumber);
  });
  
  // Prepare HTML content for printing
  const days = Object.keys(timeSlotsByDay).map(Number).sort();
  let tableHTML = '';
  
  if (days.length > 0) {
    tableHTML = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>Jam</th>
            ${days.map(day => `<th>${getDayName(day)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;
    
    timeSlotsByDay[days[0]].forEach(timeSlot => {
      tableHTML += `<tr>
        <td>${formatTime(timeSlot.startTime)} - ${formatTime(timeSlot.endTime)}</td>
      `;
      
      days.forEach(day => {
        const daySlot = timeSlotsByDay[day].find(ts => ts.slotNumber === timeSlot.slotNumber);
        if (!daySlot) {
          tableHTML += '<td></td>';
          return;
        }
        
        let detail;
        if (viewType === 'class' && id) {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        } else if (viewType === 'teacher' && id) {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        } else if (viewType === 'room' && id) {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        } else {
          detail = filteredDetails.find(d => d.timeSlotId === daySlot.id);
        }
        
        if (detail) {
          const subjectName = detail.subject?.name || `Mata Pelajaran ${detail.subjectId}`;
          const teacherName = detail.teacher?.name || `Guru ${detail.teacherId}`;
          const roomName = detail.room?.name || `Ruang ${detail.roomId}`;
          const className = detail.class?.name || `Kelas ${detail.classId}`;
          
          let cellContent = '';
          
          if (viewType === 'class') {
            cellContent = `<strong>${subjectName}</strong><br/>${teacherName}<br/>${roomName}`;
          } else if (viewType === 'teacher') {
            cellContent = `<strong>${subjectName}</strong><br/>${className}<br/>${roomName}`;
          } else if (viewType === 'room') {
            cellContent = `<strong>${subjectName}</strong><br/>${className}<br/>${teacherName}`;
          } else {
            cellContent = `<strong>${className}</strong><br/>${subjectName}<br/>${teacherName}`;
          }
          
          tableHTML += `<td>${cellContent}</td>`;
        } else {
          tableHTML += '<td></td>';
        }
      });
      
      tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
  }
  
  // Complete HTML document
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - ${subtitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 { font-size: 18px; margin-bottom: 5px; }
        h2 { font-size: 16px; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #f2f2f2; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        @media print {
          body { margin: 0; }
          h1, h2 { text-align: center; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <h2>${subtitle}</h2>
      ${tableHTML}
    </body>
    </html>
  `;
  
  // Write to the iframe and print
  const doc = iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    
    // Wait for content to load before printing
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 500);
    };
  }
};
