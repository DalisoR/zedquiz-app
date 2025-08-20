import PropTypes from 'prop-types';
import React from 'react';

import styles from './Table.module.css';

/**
 * @component Table
 * @category tables
 *
 * @description
 * [Add component description]
 *
 * @example
 * ```jsx
 * import { Table } from './Table';
 *
 * function Example() {
 *   return (
 *     <Table>
 *       [Add example usage]
 *     </Table>
 *   );
 * }
 * ```
 */

// Convert the existing component content

const Table = ({
  columns,
  data,
  onRowClick,
  className = '',
  striped = true,
  hover = true,
  border = true,
  compact = false
}) => {
  const baseClasses = 'min-w-full divide-y divide-gray-200';
  const borderClasses = border ? 'border border-gray-200 rounded-lg' : '';
  const hoverClasses = hover ? 'hover:bg-gray-50' : '';
  const compactClasses = compact ? 'p-2' : 'px-6 py-4';

  return (
    <div className={`${borderClasses} overflow-x-auto ${className}`}>
      <table className={baseClasses}>
        <thead className='bg-gray-50'>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope='col'
                className={`${compactClasses} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                ${onRowClick ? 'cursor-pointer' : ''}
                ${hoverClasses}
                ${striped && rowIndex % 2 === 0 ? 'bg-gray-50' : ''}
              `}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`${compactClasses} whitespace-nowrap text-sm text-gray-900`}
                >
                  {column.render ? column.render(row[column.field], row) : row[column.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {data.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500 text-sm'>No data available</p>
        </div>
      )}
    </div>
  );
};

Table.propTypes = {
  // Add prop types
};

Table.defaultProps = {
  // Add default props
};

export default Table;
