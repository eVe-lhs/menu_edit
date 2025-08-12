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

// Helper function to create a rounded rectangle path
function createRoundedRectPath(context, x, y, width, height, radius) {
  const cornerRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + cornerRadius, y);
  context.lineTo(x + width - cornerRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  context.lineTo(x + width, y + height - cornerRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  context.lineTo(x + cornerRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  context.lineTo(x, y + cornerRadius);
  context.quadraticCurveTo(x, y, x + cornerRadius, y);
  context.closePath();
}

/**
* Processes an image by resizing, adding a shadow, and rounding the corners.
* @param {string} dataUrl - The data URL of the image to process.
* @param {object} [options] - Optional settings for processing.
* @returns {Promise<string>} A promise that resolves with the data URL of the processed image.
*/
export async function processImageForPpt(dataUrl, options) {
  const {
      width = 900,
      height = 900,
      radius = 80, // Increased default radius for the larger image size
      shadowColor = 'rgba(0,0,0,0.4)',
      shadowBlur = 20,
      shadowOffsetX = 15,
      shadowOffsetY = 15
  } = options || {};

  return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const image = new Image();

      image.onload = () => {
          // Set canvas size to fit the final image and its shadow
          canvas.width = width + shadowBlur * 2 + Math.abs(shadowOffsetX);
          canvas.height = height + shadowBlur * 2 + Math.abs(shadowOffsetY);

          const imageX = shadowBlur + (shadowOffsetX > 0 ? 0 : -shadowOffsetX);
          const imageY = shadowBlur + (shadowOffsetY > 0 ? 0 : -shadowOffsetY);

          // --- 1. Draw the Shadow ---
          context.save();
          context.shadowColor = shadowColor;
          context.shadowBlur = shadowBlur;
          context.shadowOffsetX = shadowOffsetX;
          context.shadowOffsetY = shadowOffsetY;
          createRoundedRectPath(context, imageX, imageY, width, height, radius);
          context.fillStyle = 'white'; // The fill is needed to cast the shadow
          context.fill();
          context.restore();

          // --- 2. Draw the Rounded Image ---
          context.save();
          createRoundedRectPath(context, imageX, imageY, width, height, radius);
          context.clip(); // Clip to the rounded path
          context.drawImage(image, imageX, imageY, width, height); // Draw the resized image
          context.restore();

          resolve(canvas.toDataURL());
      };
      image.onerror = reject;
      image.src = dataUrl;
  });
}