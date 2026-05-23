// Simple icon generator using pure Node.js (no dependencies)
// Creates minimal valid PNG files for PWA icons

import { writeFileSync, mkdirSync } from "fs";

// Minimal 1x1 white PNG in base64 (will be replaced by proper icons)
// For development, we create SVG-based icons embedded as data
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
  <rect width="192" height="192" rx="38" fill="url(#g)"/>
  <text x="96" y="130" font-family="serif" font-size="110" font-weight="bold" fill="white" text-anchor="middle">&#x20B9;</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.svg", svg192);
writeFileSync("public/icons/icon-512.svg", svg192.replace(/192/g, "512").replace(/38/, "76").replace(/110/, "280").replace(/130/, "340"));
writeFileSync("public/apple-touch-icon.svg", svg192.replace(/192/g, "180").replace(/38/, "36").replace(/110/, "100").replace(/130/, "122"));
console.log("SVG icons created. Convert to PNG for production.");
