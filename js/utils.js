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

export async function roundImageCorners(dataUrl, radius) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const image = new Image();
    image.onload = () => {
      // Use image's natural width and height for the canvas
      const w = image.naturalWidth;
      const h = image.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      // Ensure radius is not larger than half the smallest dimension
      // const cornerRadius = Math.min(radius, w / 2, h / 2);
      const cornerRadius = 100

      // Draw rounded rectangle path
      context.beginPath();
      context.moveTo(cornerRadius, 0);
      context.lineTo(w - cornerRadius, 0);
      context.quadraticCurveTo(w, 0, w, cornerRadius);
      context.lineTo(w, h - cornerRadius);
      context.quadraticCurveTo(w, h, w - cornerRadius, h);
      context.lineTo(cornerRadius, h);
      context.quadraticCurveTo(0, h, 0, h - cornerRadius);
      context.lineTo(0, cornerRadius);
      context.quadraticCurveTo(0, 0, cornerRadius, 0);
      context.closePath();

      // Set the clip path
      context.clip();

      // Draw the image onto the canvas
      context.drawImage(image, 0, 0, w, h);

      // Get the result as a new data URL
      resolve(canvas.toDataURL());
    };
    image.onerror = reject;
    image.src = dataUrl;
  });
}