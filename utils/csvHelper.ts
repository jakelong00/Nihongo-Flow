
// Robust CSV parser handling quotes, newlines, and varied line endings.

export const parseCSV = <T>(csvText: string): T[] => {
  if (!csvText || csvText.trim() === '') return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  
  // Normalize line endings to \n and remove Byte Order Mark (BOM)
  const text = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote (doubled quote inside quotes)
        currentField += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      // Row separator
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Push the last field and row if there's remaining data
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  // Assume first row is headers
  const headers = rows[0].map(h => h.trim());
  const result: T[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip empty rows
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    const obj: any = {};
    headers.forEach((header, index) => {
        if (header) {
            obj[header] = row[index] || ''; 
        }
    });
    result.push(obj as T);
  }

  return result;
};

export const toCSV = <T extends object>(data: T[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => {
      return headers.map(fieldName => {
        let val = (row as any)[fieldName];
        
        // Handle Arrays or Objects (e.g. Grammar examples, Vocab conjugations)
        if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
        }

        const stringVal = val === null || val === undefined ? '' : String(val);
        
        // Quote if contains comma, newline, or double quote
        if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
            // Escape double quotes by doubling them
            return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',');
    })
  ];
  return csvRows.join('\n');
};