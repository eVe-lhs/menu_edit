export function escapeCSVField(field) {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let currentField = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (line[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }
  result.push(currentField);
  return result;
}
