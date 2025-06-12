import { appState } from "./core.js";

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
        bkgd: document
          .getElementById(`bkgd-color-${index}`)
          .value.replace("#", ""),
        font: document
          .getElementById(`font-color-${index}`)
          .value.replace("#", ""),
      };
    });
    hidePptOptionsModal();
    exportToPpt({ restaurantName, categoryStyles });
  };

  document.getElementById("cancelPptOptionsBtn").onclick = hidePptOptionsModal;
  document.querySelector("#pptOptionsModal .close").onclick =
    hidePptOptionsModal;
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
    const shapes = [
      pptx.shapes.OVAL,
      pptx.shapes.STAR_5_POINT,
      pptx.shapes.ISOSCELES_TRIANGLE,
    ];
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
        const category = appState.categories.find(
          (c) => c.name === categoryName
        );

        if (!category) {
          console.warn(
            `Skipping items for non-existent category: ${categoryName}`
          );
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
          // NEW: High-contrast restaurant name banner
          if (restaurantName) {
            currentSlide.addShape(pptx.shapes.RECTANGLE, {
              x: 0,
              y: 0,
              w: "100%",
              h: 0.5,
              fill: { color: "#800000" }, // Solid banner with font color
            });
            currentSlide.addText(restaurantName, {
              x: 0,
              y: 0,
              w: "100%",
              h: 0.5,
              align: "center",
              valign: "middle", // Vertical alignment
              color: bkgdColor, // Contrasting text color
              fontSize: 20,
              bold: true,
              fontFace: "Noto Sans",
            });
          }

          const catWidth = 5.5;
          const catX = (PAGE_WIDTH - catWidth) / 2;
          const catY = restaurantName ? 0.7 : 0.2; // Position below banner if it exists
          currentSlide.addShape(pptx.shapes.RECTANGLE, {
            x: catX,
            y: catY,
            w: catWidth,
            h: 0.6,
            fill: { color: fontColor },
          });
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
            fontFace: "Noto Sans JP",
          });
        };

        let slide = createNewSlide();
        addHeaderToSlide(slide);
        // Adjust starting Y position for items to be below the header
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
                rounding: true, // Rounded corners (PptxGenJS v3.10.0+)
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
              y: y + 1.5,
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
                  rounding: true
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
      alert(
        "An error occurred while generating the PPT. Please check the console for details."
      );
    } finally {
      loadingOverlay.style.display = "none";
    }
  }, 10);
}
