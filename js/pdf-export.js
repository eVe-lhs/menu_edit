import { appState } from "./core.js";

// --- Font Imports ---
// The path from /js/pdf-export.js to /js/fonts/ is './fonts/'
// import "./fonts/NotoSans-Regular-normal.js";
// import "./fonts/NotoSans-bold.js";
// import "./fonts/NotoSansJP-normal.js";
// import "./fonts/NotoSansMyanmar-normal.js";
// import "./fonts/NotoSansSC-normal.js";
// import "./fonts/Padauk-normal.js";
// import "./fonts/Pyidaungsu_Regular-normal.js";
// import "./fonts/MyanmarSansPro-normal.js";
// import "./fonts/Zawgyi-One-normal.js";
// import "./fonts/mm3-multi-os-normal.js";
// import "./fonts/mmrtext-normal.js"; // Ensure this is the correct path to your font file
// // Add any other font files you have here, e.g., mmrtext-normal.js

// Helper function to convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportToPdf() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex";

  // **THE FIX: Create the jsPDF instance immediately.**
  // This triggers the font registration from the imported modules.
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // Use setTimeout to allow the UI to show the loader before the heavy work begins.
  setTimeout(async () => {
    try {
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const itemHeight = 40;
      let y = margin;

      const itemsByCategory = appState.items.reduce((acc, item) => {
        const categoryName = item.Category;
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(item);
        return acc;
      }, {});

      let isFirstCategory = true;
      for (const categoryName of Object.keys(itemsByCategory)) {
        if (!isFirstCategory) doc.addPage();
        isFirstCategory = false;
        y = margin;

        const category = appState.categories.find(
          (c) => c.name === categoryName
        );
        if (!category) continue;

        // --- Corrected Font Names ---
        doc.setFont("NotoSans", "bold");
        doc.setFontSize(18);
        doc.text(category.name, margin, y);
        y += 8;

        doc.setFont("NotoSansJP", "normal");
        doc.setFontSize(14);
        doc.text(category.japan_name, margin, y);
        y += 10;

        doc.setDrawColor(0);
        doc.line(margin, y, doc.internal.pageSize.width - margin, y);
        y += 10;

        const items = itemsByCategory[categoryName];

        for (const item of items) {
          if (y + itemHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }

          const textX = margin;
          const imageX = doc.internal.pageSize.width - margin - 35;
          const imageY = y;
          const textY = y;

          doc.setFontSize(11);

          doc.setFont("NotoSans", "normal");
          doc.text(item.Name, textX, textY + 5);

          doc.setFont("NotoSansJP", "normal");
          doc.text(item.JP_Name, textX, textY + 11);

          doc.setFont("mmrtext", "normal");
          doc.text(item.MM_Name, textX, textY + 17);

          doc.setFont("NotoSansSC", "normal");
          doc.text(item.CN_Name, textX, textY + 23);

          doc.setFont("NotoSans", "bold");
          doc.setFontSize(12);
          doc.text(`¥${item.Price_Included_Tax}`, textX, textY + 30);

          if (item.Image && appState.images[item.Image]) {
            const imageBlob = appState.images[item.Image];
            const imageDataUrl = await blobToBase64(imageBlob);
            const imageExt = item.Image.split(".").pop().toUpperCase();
            if (["JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(imageExt)) {
              doc.addImage(imageDataUrl, imageExt, imageX, imageY, 35, 35);
            } else {
              doc
                .setFont("NotoSans", "normal")
                .setFontSize(8)
                .text(`(Unsupported: ${imageExt})`, imageX, imageY + 17.5);
            }
          } else {
            doc
              .setFont("NotoSans", "normal")
              .setFontSize(8)
              .text("(No Image)", imageX + 5, imageY + 17.5);
          }

          y += itemHeight;
        }
      }

      doc.save("menu.pdf");
      alert("PDF generation complete!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        "An error occurred while generating the PDF. Please check the console for details."
      );
    } finally {
      loadingOverlay.style.display = "none";
    }
  }, 10);
}
