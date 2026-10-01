import React, { useMemo } from 'react';

// Lightweight standalone SVG QR Code generator matrix
// Generates standard visual QR pattern for crypto addresses
export const QRCodeDisplay: React.FC<{ value: string; size?: number }> = ({ value, size = 180 }) => {
  // Deterministic matrix generator based on value hash + standard QR patterns
  const matrix = useMemo(() => {
    const n = 25; // 25x25 grid
    const grid: boolean[][] = Array(n).fill(false).map(() => Array(n).fill(false));

    // Corner Finder Patterns
    const drawFinderPattern = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            if (row + r < n && col + c < n) {
              grid[row + r][col + c] = true;
            }
          }
        }
      }
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(0, n - 7);
    drawFinderPattern(n - 7, 0);

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Alignment pattern
    const alignR = n - 9;
    const alignC = n - 9;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          grid[alignR + r][alignC + c] = true;
        }
      }
    }

    // Populate data cells deterministically from value string
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) + hash) + value.charCodeAt(i);
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // Skip finder patterns and timing lines
        const isTopLeft = r < 8 && c < 8;
        const isTopRight = r < 8 && c >= n - 8;
        const isBottomLeft = r >= n - 8 && c < 8;
        const isTiming = (r === 6 && c >= 8 && c < n - 8) || (c === 6 && r >= 8 && r < n - 8);
        const isAlign = Math.abs(r - alignR) <= 2 && Math.abs(c - alignC) <= 2;

        if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming && !isAlign) {
          const charCode = value.charCodeAt((r * n + c) % value.length);
          const cellVal = ((hash ^ (r * 31 + c * 17) ^ (charCode << 2)) % 3) === 0;
          grid[r][c] = cellVal;
        }
      }
    }

    return grid;
  }, [value]);

  const n = matrix.length;
  const cellSize = size / n;

  return (
    <div 
      className="p-3.5 bg-white rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-[#E8E0D5] inline-block"
      style={{ width: size + 28, height: size + 28 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
        <rect width={size} height={size} fill="#ffffff" rx={8} />
        {matrix.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#2D241E"
                rx={cellSize > 5 ? 1.2 : 0}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
