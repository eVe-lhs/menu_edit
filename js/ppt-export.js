import { appState } from "./core.js";
import { processImageForPpt } from "./utils.js";

/**
 * Determines the appropriate font and language code for a given text.
 * @param {string} text The text to analyze.
 * @returns {{fontFace: string, lang: string}} An object with the correct fontFace and lang code.
 */
function getFontOptionsForText(text) {
  // Define your fonts for each language.
  // Make sure these fonts are available in the environment where the script runs.
  const fontMap = {
    "en-US": "Noto Sans", // A safe, universal font for English
    "my-MM": "Noto Sans Myanmar", // For Myanmar
    "zh-CN": "Noto Sans SC", // For Simplified Chinese
    "ja-JP": "Noto Sans JP", // For Japanese
  };

  // Regular expressions to detect different language scripts based on Unicode ranges
  const myanmarRegex = /[\u1000-\u109F]/;
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  const chineseRegex = /[\u4E00-\u9FFF]/;

  if (myanmarRegex.test(text)) {
    return { fontFace: fontMap["my-MM"], lang: "my-MM" };
  }
  if (japaneseRegex.test(text)) {
    return { fontFace: fontMap["ja-JP"], lang: "ja-JP" };
  }
  if (chineseRegex.test(text)) {
    return { fontFace: fontMap["zh-CN"], lang: "zh-CN" };
  }

  // Default to English if no other script is detected
  return { fontFace: fontMap["en-US"], lang: "en-US" };
}

// --- Color palettes for categories ---
const defaultColorPalettes = [
  { bkgd: "FFFFFF", font: "363636" }, // Default White
  { bkgd: "F1F8E9", font: "558B2F" }, // Light Green
  { bkgd: "E3F2FD", font: "1565C0" }, // Light Blue
  { bkgd: "FFFDE7", font: "F9A825" }, // Light Yellow
  { bkgd: "FBE9E7", font: "D84315" }, // Light Orange
  { bkgd: "EFEBE9", font: "4E342E" }, // Light Brown
  { bkgd: "F3E5F5", font: "6A1B9A" }, // Light Purple
  { bkgd: "E0F2F1", font: "00695C" }, // Light Teal
];

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
      const baseItem = group.find((item) => !item.Name.includes("[")) || group[0];
      processedList.push({
        isGroup: true,
        Code: baseItem.Code,
        baseName: baseItem.Name.replace(/\s*\[.*?\]/g, ""),
        baseJpName: baseItem.JP_Name.replace(/\s*\[.*?\]/g, ""),
        baseMmName: baseItem.MM_Name.replace(/\s*\[.*?\]/g, ""),
        baseCnName: baseItem.CN_Name.replace(/\s*\[.*?\]/g, ""),
        baseVnName: baseItem.VN_Name.replace(/\s*\[.*?\]/g, ""),
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

function hidePptOptionsModal() {
  document.getElementById("pptOptionsModal").style.display = "none";
}

export function showPptOptionsModal() {
  const container = document.getElementById("categoryStylesContainer");
  container.innerHTML = ""; // Clear previous content

  appState.categories.forEach((category, index) => {
    const palette = defaultColorPalettes[index % defaultColorPalettes.length];
    const item = document.createElement("div");
    item.className = "category-style-item";
    item.innerHTML = `
      <h4>${category.name}</h4>
      <div class="color-picker-group">
        <div>
          <label for="bkgd-color-${index}">Background</label>
          <input type="color" id="bkgd-color-${index}" value="#${palette.bkgd}">
        </div>
        <div>
          <label for="font-color-${index}">Font</label>
          <input type="color" id="font-color-${index}" value="#${palette.font}">
        </div>
      </div>
    `;
    container.appendChild(item);
  });

  document.getElementById("pptOptionsModal").style.display = "block";

  document.getElementById("generatePptBtn").onclick = () => {
    const restaurantName = document.getElementById("restaurantName").value;
    const categoryStyles = {};
    appState.categories.forEach((category, index) => {
      categoryStyles[category.name] = {
        bkgd: document.getElementById(`bkgd-color-${index}`).value.replace("#", ""),
        font: document.getElementById(`font-color-${index}`).value.replace("#", ""),
      };
    });
    hidePptOptionsModal();
    exportToPpt({ restaurantName, categoryStyles });
  };

  document.getElementById("cancelPptOptionsBtn").onclick = hidePptOptionsModal;
  document.querySelector("#pptOptionsModal .close").onclick = hidePptOptionsModal;
}

// NEW: Helper function to add multilingual text
function addMultilingualText(slide, texts, options) {
  let currentX = options.x;
  const spacing = 0.1; // Adjust this value for spacing between text parts

  texts.forEach((textInfo) => {
    if (textInfo.text) {
      const textNode = {
        text: textInfo.text,
        options: {
          ...options,
          x: currentX,
          fontFace: textInfo.font,
          w: "auto", // Set width to auto to measure text width
        },
      };
      slide.addText([textNode]);
      // Estimate text width to position the next text block.
      // This is a rough estimation. For more accuracy, you might need a more complex solution.
      currentX += textInfo.text.length * (options.fontSize / 72) * 0.7 + spacing;
    }
  });
}

export async function exportToPpt(options) {
  const { restaurantName, categoryStyles } = options;
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex";

  const pptx = new PptxGenJS();
  const PAGE_WIDTH = 8.27;
  const PAGE_HEIGHT = 11.69;
  pptx.defineLayout({
    name: "A4_PORTRAIT_CUSTOM",
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });
  pptx.layout = "A4_PORTRAIT_CUSTOM";

  const addRandomShapes = (slide, count, color) => {
    const shapes = [pptx.shapes.OVAL, pptx.shapes.STAR_5_POINT, pptx.shapes.ISOSCELES_TRIANGLE];
    for (let i = 0; i < count; i++) {
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
      slide.addShape(shapeType, {
        x: Math.random() * (PAGE_WIDTH - 0.5),
        y: Math.random() * (PAGE_HEIGHT - 0.5),
        w: Math.random() * 0.3 + 0.15,
        h: Math.random() * 0.3 + 0.15,
        fill: { color: color, alpha: 85 },
        rotate: Math.random() * 360,
      });
    }
  };

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
      for (const categoryName of categoryNames) {
        const category = appState.categories.find((c) => c.name === categoryName);

        if (!category) {
          console.warn(`Skipping items for non-existent category: ${categoryName}`);
          continue;
        }

        const style = categoryStyles[categoryName] || defaultColorPalettes[0];
        const bkgdColor = style.bkgd;
        const fontColor = style.font;

        const createNewSlide = () => {
          const newSlide = pptx.addSlide();
          newSlide.addShape(pptx.shapes.RECTANGLE, {
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
            fill: { color: bkgdColor },
          });
          addRandomShapes(newSlide, 10, fontColor);
          return newSlide;
        };

        const addHeaderToSlide = (currentSlide) => {
          if (restaurantName) {
            currentSlide.addShape(pptx.shapes.RECTANGLE, {
              x: 0,
              y: 0,
              w: "100%",
              h: 0.5,
              fill: { color: "#800000" },
            });
            const RnameTextOptions = getFontOptionsForText(restaurantName);
            currentSlide.addText(restaurantName, {
              x: 0,
              y: 0,
              w: "100%",
              h: 0.5,
              align: "center",
              valign: "middle",
              color: bkgdColor,
              fontSize: 20,
              bold: true,
              fontFace: RnameTextOptions.fontFace,
              lang: RnameTextOptions.lang,
            });
          }

          const catWidth = 5.5;
          const catX = (PAGE_WIDTH - catWidth) / 2;
          const catY = restaurantName ? 0.7 : 0.2;
          currentSlide.addShape(pptx.shapes.RECTANGLE, {
            x: catX,
            y: catY,
            w: catWidth,
            h: 0.6,
            fill: { color: fontColor },
          });
          const CattextOptions = getFontOptionsForText(category.japan_name);
          currentSlide.addText(category.japan_name, {
            x: catX,
            y: catY,
            w: catWidth,
            h: 0.6,
            align: "center",
            valign: "middle",
            color: bkgdColor,
            fontSize: 28,
            bold: true,
            fontFace: CattextOptions.fontFace,
            lang: CattextOptions.lang,
          });
        };

        let slide = createNewSlide();
        addHeaderToSlide(slide);
        let y = 1.5;

        for (const [index, item] of itemsByCategory[categoryName].entries()) {
          let neededHeight = 2.2;
          if (item.isGroup) {
            neededHeight = 1.6 + item.options.length * 0.4;
          }
          if (y + neededHeight > 11) {
            slide = createNewSlide();
            addHeaderToSlide(slide);
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
            const textOptions = getFontOptionsForText(item.baseJpName);
            slide.addText(item.baseJpName, {
              x: textX,
              y: y + 0.4,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: textOptions.fontFace,
              lang: textOptions.lang,
            });
            const mmTextOptions = getFontOptionsForText(item.baseMmName);
            slide.addText(item.baseMmName, {
              x: textX,
              y: y + 0.7,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: mmTextOptions.fontFace,
              lang: mmTextOptions.lang,
            });
            const cnTextOptions = getFontOptionsForText(item.baseCnName);
            slide.addText(item.baseCnName, {
              x: textX,
              y: y + 1.0,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: cnTextOptions.fontFace,
              lang: cnTextOptions.lang,
            });
            slide.addText(item.baseVnName, {
              x: textX,
              y: y + 1.3,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans VN",
            });

            let optionY = y + 1.7;
            item.options.forEach((opt) => {
              const opt_en = opt.Name.match(/\[(.*?)\]/)?.[1];
              const opt_jp = opt.JP_Name.match(/\[(.*?)\]/)?.[1];
              const opt_mm = opt.MM_Name.match(/\[(.*?)\]/)?.[1];
              const opt_cn = opt.CN_Name.match(/\[(.*?)\]/)?.[1];
              const opt_vn = opt.VN_Name.match(/\[(.*?)\]/)?.[1];

              const multilingualOptions = [
                { text: opt_en || "Regular", font: "Noto Sans" },
                { text: opt_jp ? ` / ${opt_jp}` : " / 通常", font: "Noto Sans JP" },
                { text: opt_mm ? ` / ${opt_mm}` : " / ပုံမှန်", font: "Noto Sans Myanmar" },
                { text: opt_cn ? ` / ${opt_cn}` : " / 普通", font: "Noto Sans SC" },
                { text: opt_vn ? ` / ${opt_vn}` : " / Bình thường", font: "Noto Sans VN" },
              ];

              addMultilingualText(slide, multilingualOptions, {
                x: textX,
                y: optionY,
                w: 3,
                h: 0.3,
                fontSize: 10,
                color: fontColor,
              });

              slide.addText(`¥${opt.Price} (¥${opt.Price_Included_Tax} 税込)`, {
                x: textX + 3.0,
                y: optionY,
                w: 2.0,
                h: 0.3,
                fontSize: 10,
                bold: true,
                color: fontColor,
                align: "right",
              });
              optionY += 0.4;
            });

            if (item.image && appState.images[item.image]) {
              const originalImageDataUrl = await blobToBase64(appState.images[item.image]);
              const processedImageDataUrl = await processImageForPpt(originalImageDataUrl);
              slide.addImage({
                data: processedImageDataUrl,
                x: imageX,
                y: y,
                w: 2.0,
                h: 2.0,
              });
            }
          } else {
            // Single Item
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
            const textOptions = getFontOptionsForText(item.JP_Name);
            slide.addText(item.JP_Name, {
              x: textX,
              y: y + 0.4,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: textOptions.fontFace,
              lang: textOptions.lang,
            });
            const mmTextOptions = getFontOptionsForText(item.MM_Name);
            slide.addText(item.MM_Name, {
              x: textX,
              y: y + 0.7,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: mmTextOptions.fontFace,
              lang: mmTextOptions.lang,
            });
            const cnTextOptions = getFontOptionsForText(item.CN_Name);
            slide.addText(item.CN_Name, {
              x: textX,
              y: y + 1.0,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: cnTextOptions.fontFace,
              lang: cnTextOptions.lang,
            });
            slide.addText(item.VN_Name, {
              x: textX,
              y: y + 1.3,
              w: 5.0,
              h: 0.3,
              fontSize: 11,
              color: fontColor,
              fontFace: "Noto Sans VN",
            });
            slide.addText(`¥${item.Price} (¥${item.Price_Included_Tax} 税込)`, {
              x: textX,
              y: y + 1.8,
              w: 5.0,
              h: 0.3,
              fontSize: 14,
              bold: true,
              color: fontColor,
              fontFace: "Noto Sans",
            });

            if (item.Image && appState.images[item.Image]) {
              const originalImageDataUrl = await blobToBase64(appState.images[item.Image]);
              const processedImageDataUrl = await processImageForPpt(originalImageDataUrl);
              slide.addImage({
                data: processedImageDataUrl,
                x: imageX,
                y: y,
                w: 2.0,
                h: 2.0,
              });
            }
          }

          const dividerY = y + neededHeight + 0.3;
          slide.addShape(pptx.shapes.LINE, {
            x: 0.5,
            y: dividerY,
            w: 7.27,
            h: 0,
            line: { color: fontColor, width: 0.5, dashType: "dash" },
          });
          y = dividerY + 0.2;
        }
      }

      pptx.writeFile({ fileName: "custom_menu.pptx" });
      alert("Custom PPT generation complete!");
    } catch (error) {
      console.error("Error generating PPT:", error);
      alert("An error occurred while generating the PPT. Please check the console for details.");
    } finally {
      loadingOverlay.style.display = "none";
    }
  }, 10);
}
