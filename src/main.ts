import exampleIconUrl from "./noun-paperclip-7598668-00449F.png";
import "./style.css";

document.body.innerHTML = `
  <h1> Annette's D2 Assignment </h1>
  <p>Example image asset: <img src="${exampleIconUrl}" class="icon" /></p>
  <p>Hello, world! </p>
`;
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
