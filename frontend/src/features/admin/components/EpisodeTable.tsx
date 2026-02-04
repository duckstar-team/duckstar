import React from 'react';
import { cn } from '@/lib';

export interface EpisodeTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
}

interface EpisodeTableProps<T> {
  columns: EpisodeTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => React.Key;
  emptyMessage?: string;
  footer?: React.ReactNode;
}

export default function EpisodeTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  footer,
}: EpisodeTableProps<T>) {
  return (
    <div className="space-y-2">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-zinc-600">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="p-2 text-left text-xs font-medium whitespace-nowrap text-gray-500 dark:text-white"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            emptyMessage ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-4 text-center text-sm text-gray-500 dark:text-zinc-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : null
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="border-t border-gray-200 dark:border-zinc-600"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'p-2 text-sm whitespace-nowrap text-gray-600 dark:text-zinc-400',
                      column.key === 'titleKor' &&
                        'max-w-70 min-w-70 text-sm whitespace-normal text-gray-900 dark:text-zinc-200'
                    )}
                  >
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
