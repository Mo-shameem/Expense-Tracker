// Run with: node generate-icons.js
// Requires: npm install canvas (optional - only needed to generate icons)
// Alternatively, place your own 192x192 and 512x512 PNG files at:
//   public/icons/icon-192.png
//   public/icons/icon-512.png
//   public/apple-touch-icon.png (180x180)

import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#4f46e5')
  grad.addColorStop(1, '#7c3aed')
  ctx.fillStyle = grad
  roundRect(ctx, 0, 0, size, size, size * 0.2)
  ctx.fill()

  // Coin symbol
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${size * 0.55}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('₹', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', drawIcon(192))
writeFileSync('public/icons/icon-512.png', drawIcon(512))
writeFileSync('public/apple-touch-icon.png', drawIcon(180))
console.log('Icons generated successfully!')
