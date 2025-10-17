import "./style.css";

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
const drawings: Point[][] = []; // array of strokes, each stroke = array of points
let currentStroke: Point[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentStroke = [{ x: cursor.x, y: cursor.y }];
  drawings.push(currentStroke);
  console.log("Started new stroke at", cursor.x, cursor.y);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentStroke) return;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  currentStroke.push({ x: cursor.x, y: cursor.y });
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
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  drawings.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});
