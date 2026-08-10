interface FigureTableProps {
  headers: string[];
  rows: string[][];
}

export function FigureTable({ headers, rows }: FigureTableProps) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse font-mono text-mono-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b-2 border-line px-3.5 py-2.5 text-left text-label uppercase text-ink-3"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isLastRow = rowIndex === rows.length - 1;
            return (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-3.5 py-3 text-ink ${isLastRow ? "" : "border-b border-line"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
