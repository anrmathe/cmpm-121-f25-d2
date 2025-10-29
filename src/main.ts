import "./style.css";

// ✅ Use interfaces to define shapes—no classes
interface Point {
  x: number;
  y: number;
}
interface MarkerLine {
  points: Point[];
  thickness: number;
}
interface Sticker {
  x: number;
  y: number;
  sticker: string;
}
interface StickerPreview {
  x: number;
  y: number;
  sticker: string;
}
interface ToolPreview {
  x: number;
  y: number;
  thickness: number;
}

// ✅ Factory functions instead of constructors
const createMarkerLine = (
  x: number,
  y: number,
  thickness: number,
): MarkerLine => ({
  points: [{ x, y }],
  thickness,
});

const createSticker = (x: number, y: number, sticker: string): Sticker => ({
  x,
  y,
  sticker,
});

const createStickerPreview = (
  x: number,
  y: number,
  sticker: string,
): StickerPreview => ({ x, y, sticker });

const createToolPreview = (
  x: number,
  y: number,
  thickness: number,
): ToolPreview => ({ x, y, thickness });

// ✅ Pure drawing functions — operate on data, not methods
const drawSticker = (
  ctx: CanvasRenderingContext2D,
  s: Sticker | StickerPreview,
) => {
  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.sticker, s.x, s.y);
};

const drawToolPreview = (ctx: CanvasRenderingContext2D, p: ToolPreview) => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.thickness / 2, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.stroke();
};

const drawMarkerLine = (ctx: CanvasRenderingContext2D, line: MarkerLine) => {
  if (line.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(line.points[0].x, line.points[0].y);
  for (let i = 1; i < line.points.length; i++) {
    ctx.lineTo(line.points[i].x, line.points[i].y);
  }
  ctx.lineWidth = line.thickness;
  ctx.lineCap = "round";
  ctx.stroke();
};

// --- HTML structure ---
document.body.innerHTML = `<h1>Annette's D2 Assignment</h1>`;
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
const ctx = canvas.getContext("2d")!;
if (!ctx) throw new Error("Could not get 2D context");

// --- Data model (unchanged, but now uses structural types)
const drawings: (MarkerLine | Sticker)[] = [];
const redoStack: (MarkerLine | Sticker)[] = [];
let currentStroke: MarkerLine | null = null;
let currentThickness = 2;
let currentSticker: string | null = null;
let currentStickerPreview: StickerPreview | null = null;
let currentPreview: ToolPreview | null = null;
const cursor = { active: false, x: 0, y: 0 };

// --- CANVAS EVENTS ---
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  if (currentSticker) {
    drawings.push(createSticker(cursor.x, cursor.y, currentSticker));
    canvas.dispatchEvent(new Event("drawing-changed"));
    cursor.active = false;
  } else {
    currentStroke = createMarkerLine(cursor.x, cursor.y, currentThickness);
    drawings.push(currentStroke);
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  if (cursor.active && currentStroke) {
    currentStroke.points.push({ x: cursor.x, y: cursor.y });
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else if (currentSticker) {
    currentStickerPreview = createStickerPreview(
      cursor.x,
      cursor.y,
      currentSticker,
    );
    canvas.dispatchEvent(new Event("tool-moved"));
  } else {
    currentPreview = createToolPreview(cursor.x, cursor.y, currentThickness);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentStroke = null;
});

canvas.style.cursor = "crosshair";

// --- REDRAW ---
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  for (const drawing of drawings) {
    if ("sticker" in drawing) {
      drawSticker(ctx, drawing);
    } else {
      drawMarkerLine(ctx, drawing);
    }
  }
  if (!cursor.active) {
    if (currentStickerPreview) drawSticker(ctx, currentStickerPreview);
    else if (currentPreview) drawToolPreview(ctx, currentPreview);
  }
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

// --- BUTTONS & LOGIC (unchanged except for DOM setup)
const stickers = ["🦌", "👑", "🌙"];
const stickerButtons: HTMLButtonElement[] = [];
stickers.forEach((s) => {
  const btn = document.createElement("button");
  btn.textContent = s;
  document.body.append(btn);
  stickerButtons.push(btn);
  btn.addEventListener("click", () => {
    currentSticker = s;
    updateSelectedTool(btn);
    canvas.dispatchEvent(new Event("tool-moved"));
  });
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
document.body.append(thinButton);
const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
document.body.append(thickButton);
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

function updateSelectedTool(selectedButton: HTMLButtonElement) {
  document.querySelectorAll("button").forEach((b) =>
    b.classList.remove("selectedTool")
  );
  selectedButton.classList.add("selectedTool");
}

clearButton.addEventListener("click", () => {
  drawings.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

undoButton.addEventListener("click", () => {
  if (drawings.length === 0) return;
  const undone = drawings.pop()!;
  redoStack.push(undone);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redone = redoStack.pop()!;
  drawings.push(redone);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  currentSticker = null;
  currentStickerPreview = null;
  updateSelectedTool(thinButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  currentSticker = null;
  currentStickerPreview = null;
  updateSelectedTool(thickButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

updateSelectedTool(thinButton);
