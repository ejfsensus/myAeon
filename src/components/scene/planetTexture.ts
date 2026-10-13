import { CanvasTexture, SRGBColorSpace } from "three";
export function planetTexture(id: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext("2d")!;
  c.fillStyle = color;
  c.fillRect(0, 0, 512, 256);
  let seed = [...id].reduce((n, ch) => n + ch.charCodeAt(0), 7);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (["jupiter", "saturn", "uranus", "neptune"].includes(id)) {
    for (let y = 0; y < 256; y += 2) {
      const wave = Math.sin(y * 0.2) * 0.08 + random() * 0.08;
      c.fillStyle = `rgba(${y % 24 < 12 ? "255,235,201" : "40,32,65"},${0.08 + Math.abs(wave)})`;
      c.fillRect(0, y, 512, 2);
    }
    if (id === "jupiter") {
      c.fillStyle = "rgba(149,74,39,.6)";
      c.beginPath();
      c.ellipse(310, 160, 42, 15, 0.06, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    for (let i = 0; i < 1000; i++) {
      const x = random() * 512,
        y = random() * 256,
        r = random() * 12 + 1;
      c.fillStyle =
        id === "earth"
          ? `rgba(${i % 3 ? "38,111,70" : "220,235,244"},${0.12 + random() * 0.45})`
          : `rgba(${i % 2 ? "255,216,173" : "40,28,30"},${random() * 0.18})`;
      c.beginPath();
      c.ellipse(x, y, r * 2, r, random() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
