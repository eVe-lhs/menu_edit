import { appState } from "./core.js";

// Helper function to convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function groupOptionItemsByCode(items) {
  const groupedByCode = {};
  const processedList = [];

  items.forEach((item) => {
    if (!groupedByCode[item.Code]) {
      groupedByCode[item.Code] = [];
    }
    groupedByCode[item.Code].push(item);
  });

  Object.values(groupedByCode).forEach((group) => {
    if (group.length > 1) {
      const baseItem =
        group.find((item) => !item.Name.includes("[")) || group[0];
      processedList.push({
        isGroup: true,
        Code: baseItem.Code,
        baseName: baseItem.Name.replace(/\s*\[.*?\]/g, ""),
        baseJpName: baseItem.JP_Name.replace(/\s*\[.*?\]/g, ""),
        baseMmName: baseItem.MM_Name.replace(/\s*\[.*?\]/g, ""),
        baseCnName: baseItem.CN_Name.replace(/\s*\[.*?\]/g, ""),
        image: baseItem.Image,
        options: group,
        Category: baseItem.Category,
      });
    } else {
      processedList.push({ isGroup: false, ...group[0] });
    }
  });

  return processedList;
}

const naturalSortComparator = (a, b) => {
  const re = /([A-Z]+-?)(\d+)/;
  const matchA = a.Code.match(re);
  const matchB = b.Code.match(re);

  if (matchA && matchB) {
    const prefixA = matchA[1];
    const numA = parseInt(matchA[2], 10);
    const prefixB = matchB[1];
    const numB = parseInt(matchB[2], 10);

    if (prefixA < prefixB) return -1;
    if (prefixA > prefixB) return 1;
    return numA - numB;
  }
  return a.Code.localeCompare(b.Code);
};

export async function exportToPpt() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex";

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4_PORTRAIT_CUSTOM", width: 8.27, height: 11.69 });
  pptx.layout = "A4_PORTRAIT_CUSTOM";

  // --- NEW: Color palettes for categories ---
  const colorPalettes = [
    { bkgd: "FFFFFF", font: "363636", line: "C7C7C7" }, // Default White
    { bkgd: "F1F8E9", font: "558B2F", line: "A5D6A7" }, // Light Green
    { bkgd: "E3F2FD", font: "1565C0", line: "90CAF9" }, // Light Blue
    { bkgd: "FFFDE7", font: "F9A825", line: "FFE082" }, // Light Yellow
    { bkgd: "FBE9E7", font: "D84315", line: "FFAB91" }, // Light Orange
    { bkgd: "EFEBE9", font: "4E342E", line: "BCAAA4" }, // Light Brown
    { bkgd: "F3E5F5", font: "6A1B9A", line: "CE93D8" }, // Light Purple
    { bkgd: "E0F2F1", font: "00695C", line: "80CBC4" }, // Light Teal
  ];

  setTimeout(async () => {
    try {
      const processedItems = groupOptionItemsByCode(appState.items);
      const itemsByCategory = processedItems.reduce((acc, item) => {
        const categoryName = item.Category;
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(item);
        return acc;
      }, {});

      for (const category in itemsByCategory) {
        itemsByCategory[category].sort(naturalSortComparator);
      }

      const categoryNames = Object.keys(itemsByCategory);
      for (const [categoryIndex, categoryName] of categoryNames.entries()) {
        const category = appState.categories.find(
          (c) => c.name === categoryName
        );
        if (!category) continue;

        // Assign colors for the current category
        const palette = colorPalettes[categoryIndex % colorPalettes.length];
        const bkgdColor = palette.bkgd;
        const fontColor = palette.font;
        const lineColor = palette.line;

        let slide = pptx.addSlide({ bkgd: bkgdColor });

        const addCategoryHeader = (currentSlide) => {
          currentSlide.addText(category.name, {
            x: 0.5,
            y: 0.25,
            w: 3.6,
            h: 0.4,
            color: fontColor,
            fontSize: 24,
            bold: true,
            fontFace: "Noto Sans",
          });
          currentSlide.addText(category.japan_name, {
            x: 0.5,
            y: 0.65,
            w: 3.6,
            h: 0.4,
            color: fontColor,
            fontSize: 18,
            fontFace: "Noto Sans JP",
          });
          currentSlide.addText(category.myanmar_name, {
            x: 4.25,
            y: 0.25,
            w: 3.6,
            h: 0.4,
            color: fontColor,
            fontSize: 18,
            fontFace: "Noto Sans Myanmar",
            align: "right",
          });
          currentSlide.addText(category.chinese_name, {
            x: 4.25,
            y: 0.65,
            w: 3.6,
            h: 0.4,
            color: fontColor,
            fontSize: 18,
            fontFace: "Noto Sans SC",
            align: "right",
          });
        };

        addCategoryHeader(slide);
        let y = 1.5;

        for (const [index, item] of itemsByCategory[categoryName].entries()) {
          let neededHeight = 2.2;
          if (item.isGroup) {
            neededHeight = 1.6 + item.options.length * 0.4;
          }
          if (y + neededHeight > 11.5) {
            slide = pptx.addSlide({ bkgd: bkgdColor });
            addCategoryHeader(slide);
            y = 1.5;
          }

          const isEven = index % 2 === 0;
          const textX = isEven ? 2.75 : 0.5;
          const imageX = isEven ? 0.5 : 5.75;

          slide.addShape(pptx.shapes.RECTANGLE, {
            x: textX,
            y: y,
            w: 0.8,
            h: 0.3,
            fill: { color: fontColor },
            rectRadius: 0.1,
          });
          slide.addText(item.Code, {
            x: textX,
            y: y,
            w: 0.8,
            h: 0.3,
            align: "center",
            color: bkgdColor,
            fontSize: 10,
            bold: true,
          });

          if (item.isGroup) {
            slide.addText(item.baseName, {
              x: textX + 0.9,
              y: y,
              w: 4.1,
              h: 0.3,
              fontSize: 12,
              bold: true,
              color: fontColor,
              fontFace: "Noto Sans",
            });
            slide.addText(item.baseJpName, {
              x: textX,
              y: y + 0.4,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans JP",
            });
            slide.addText(item.baseMmName, {
              x: textX,
              y: y + 0.7,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans Myanmar",
            });
            slide.addText(item.baseCnName, {
              x: textX,
              y: y + 1.0,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans SC",
            });

            let optionY = y + 1.4;
            item.options.forEach((opt) => {
              const opt_en = opt.Name.match(/\[(.*?)\]/)?.[1];
              const optionName = opt_en
                ? [
                    opt_en,
                    opt.JP_Name.match(/\[(.*?)\]/)?.[1],
                    opt.MM_Name.match(/\[(.*?)\]/)?.[1],
                    opt.CN_Name.match(/\[(.*?)\]/)?.[1],
                  ]
                    .filter(Boolean)
                    .join(" / ")
                : "Regular / 通常 / ပုံမှန် / 普通";
              slide.addText(optionName, {
                x: textX,
                y: optionY,
                w: 3.5,
                h: 0.3,
                fontSize: 10,
                color: fontColor,
              });
              slide.addText(`¥${opt.Price_Included_Tax}`, {
                x: textX + 3.6,
                y: optionY,
                w: 1.4,
                h: 0.3,
                fontSize: 11,
                bold: true,
                color: fontColor,
              });
              optionY += 0.4;
            });

            if (item.image && appState.images[item.image]) {
              const imageDataUrl = await blobToBase64(
                appState.images[item.image]
              );
              slide.addImage({
                data: imageDataUrl,
                x: imageX,
                y: y,
                w: 2.0,
                h: 2.0,
              });
            }
          } else {
            slide.addText(item.Name, {
              x: textX + 0.9,
              y: y,
              w: 4.1,
              h: 0.3,
              fontSize: 12,
              bold: true,
              color: fontColor,
              fontFace: "Noto Sans",
            });
            slide.addText(item.JP_Name, {
              x: textX,
              y: y + 0.4,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans JP",
            });
            slide.addText(item.MM_Name, {
              x: textX,
              y: y + 0.7,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans Myanmar",
            });
            slide.addText(item.CN_Name, {
              x: textX,
              y: y + 1.0,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans SC",
            });
            slide.addText(`¥${item.Price_Included_Tax}`, {
              x: textX,
              y: y + 1.4,
              w: 5.0,
              h: 0.3,
              fontSize: 14,
              bold: true,
              color: fontColor,
              fontFace: "Noto Sans",
            });

            if (item.Image && appState.images[item.Image]) {
              const imageDataUrl = await blobToBase64(
                appState.images[item.Image]
              );
              slide.addImage({
                data: imageDataUrl,
                x: imageX,
                y: y,
                w: 2.0,
                h: 2.0,
              });
            }
          }
          slide.addShape(pptx.shapes.LINE, {
            x: 0.5,
            y: y + neededHeight - 0.2,
            w: 7.27,
            h: 0,
            line: { color: lineColor, width: 1 },
          });
          y += neededHeight;
        }
      }

      pptx.writeFile({ fileName: "menu_final_themed.pptx" });
      alert("Themed PPT generation complete!");
    } catch (error) {
      console.error("Error generating PPT:", error);
      alert(
        "An error occurred while generating the PPT. Please check the console for details."
      );
    } finally {
      loadingOverlay.style.display = "none";
    }
  }, 10);
}
