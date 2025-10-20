import "./style.css";

class MarkerLine {
  points: Point[];

  constructor(startX: number, startY: number) {
    this.points = [{ x: startX, y: startY }];
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

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get 2D context");

// --- Data model ---
type Point = { x: number; y: number };
const drawings: MarkerLine[] = [];
const redoStack: MarkerLine[] = [];
let currentStroke: MarkerLine | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentStroke = new MarkerLine(cursor.x, cursor.y);
  drawings.push(currentStroke);
  redoStack.length = 0;
  console.log("Started new stroke at", cursor.x, cursor.y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentStroke) return;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentStroke.drag(cursor.x, cursor.y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseup", (_e) => {
  cursor.active = false;
  currentStroke = null;
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  for (const stroke of drawings) {
    stroke.display(ctx);
  }
});

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
  if (undoneStroke) {
    redoStack.push(undoneStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redoneStroke = redoStack.pop()!;
  if (redoneStroke) {
    drawings.push(redoneStroke);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});
