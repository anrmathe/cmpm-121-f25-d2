import "./style.css";

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
const drawings: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentStroke: MarkerLine | null = null;
let currentThickness = 2;
let currentPreview: ToolPreview | null = null; // ⭐ preview object

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentStroke = new MarkerLine(cursor.x, cursor.y, currentThickness);
  drawings.push(currentStroke);
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && currentStroke) {
    currentStroke.drag(cursor.x, cursor.y);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    // ⭐ Update preview when mouse moves but not drawing
    currentPreview = new ToolPreview(cursor.x, cursor.y, currentThickness);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentStroke = null;
});
canvas.style.cursor = "crosshair";
// --- Redraw logic ---
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";

  for (const stroke of drawings) {
    stroke.display(ctx);
  }

  // ⭐ Draw preview if mouse not pressed
  if (!cursor.active && currentPreview) {
    currentPreview.draw(ctx);
  }
}

canvas.addEventListener("drawing-changed", redraw);

// ⭐ Tool-moved event: same as drawing-changed but triggered differently
canvas.addEventListener("tool-moved", redraw);

// --- Buttons ---
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  drawings.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (drawings.length === 0) return;
  const undoneStroke = drawings.pop()!;
  redoStack.push(undoneStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redoneStroke = redoStack.pop()!;
  drawings.push(redoneStroke);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
document.body.append(thickButton);

function updateSelectedTool(selectedButton: HTMLButtonElement) {
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  selectedButton.classList.add("selectedTool");
}

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  updateSelectedTool(thinButton);
});

thickButton.addEventListener("click", () => {
  currentThickness = 6;
  updateSelectedTool(thickButton);
});

// Start with thin selected
updateSelectedTool(thinButton);
