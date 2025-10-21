import "./style.css";

// ⭐ Sticker preview command
class StickerPreview {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// ⭐ Sticker command
class Sticker {
  x: number;
  y: number;
  sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// --- Marker class ---
class MarkerLine {
  points: Point[];
  thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points = [{ x: startX, y: startY }];
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.lineWidth = this.thickness;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

// ⭐ Tool preview command
class ToolPreview {
  x: number;
  y: number;
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// --- HTML structure ---
document.body.innerHTML = `
  <h1> Annette's D2 Assignment </h1>
`;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d")!;
if (!ctx) throw new Error("Could not get 2D context");

// --- Data model ---
type Point = { x: number; y: number };
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
    drawings.push(new Sticker(cursor.x, cursor.y, currentSticker));
    canvas.dispatchEvent(new Event("drawing-changed"));
    cursor.active = false;
  } else {
    currentStroke = new MarkerLine(cursor.x, cursor.y, currentThickness);
    drawings.push(currentStroke);
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && currentStroke) {
    currentStroke.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else if (currentSticker) {
    currentStickerPreview = new StickerPreview(
      cursor.x,
      cursor.y,
      currentSticker,
    );
    canvas.dispatchEvent(new Event("tool-moved"));
  } else {
    currentPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
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

  for (const stroke of drawings) {
    stroke.display(ctx);
  }

  if (!cursor.active) {
    if (currentStickerPreview) currentStickerPreview.draw(ctx);
    else if (currentPreview) currentPreview.draw(ctx);
  }
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

// --- BUTTONS ---

// Stickers
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

// Marker thickness buttons
const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
document.body.append(thickButton);

// Control buttons
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

// --- Button logic ---
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
  currentSticker = null; // exit sticker mode
  currentStickerPreview = null;
  updateSelectedTool(thinButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  currentSticker = null; // exit sticker mode
  currentStickerPreview = null;
  updateSelectedTool(thickButton);
  canvas.dispatchEvent(new Event("tool-moved"));
});

// Start with thin selected
updateSelectedTool(thinButton);
