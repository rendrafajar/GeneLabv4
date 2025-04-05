import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    title: string;
    render?: (record: T) => React.ReactNode;
  }[];
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  idField?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onDelete,
  onEdit,
  idField = 'id'
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.title}</TableHead>
          ))}
          {(onEdit || onDelete) && <TableHead className="text-right">Aksi</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center py-8">
              Tidak ada data yang tersedia
            </TableCell>
          </TableRow>
        ) : (
          data.map((record) => (
            <TableRow key={record[idField]}>
              {columns.map((column) => (
                <TableCell key={`${record[idField]}-${column.key}`}>
                  {column.render 
                    ? column.render(record)
                    : record[column.key] !== undefined
                    ? String(record[column.key])
                    : '—'
                  }
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onEdit(record[idField])}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(record[idField])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function renderBoolean(value: boolean): React.ReactNode {
  return (
    <Badge variant={value ? 'success' : 'secondary'}>
      {value ? 'Ya' : 'Tidak'}
    </Badge>
  );
}