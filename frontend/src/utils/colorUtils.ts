import * as THREE from 'three';
import chroma from 'chroma-js';

export const getColorByPalette = (value: number, min: number, max: number, palette: string): THREE.Color => {
  let range = max - min;
  if (range === 0) range = 1;
  let t = (value - min) / range;
  t = Math.max(0, Math.min(1, t));
  
  let hex = '#ffffff';
  switch(palette) {
    case 'thermal': hex = chroma.scale(['#0000ff', '#00ffff', '#ffff00', '#ff0000'])(t).hex(); break;
    case 'viridis': hex = chroma.scale(['#440154', '#3b528b', '#21908c', '#5dc963', '#fde725'])(t).hex(); break;
    case 'plasma': hex = chroma.scale(['#0d0887', '#7e03a8', '#cc4778', '#f89540', '#f0f921'])(t).hex(); break;
    case 'blues': hex = chroma.scale(['#08306b', '#2171b5', '#6baed6', '#c6dbef'])(t).hex(); break;
    default: hex = chroma.scale(['#0000ff', '#00ffff', '#ffff00', '#ff0000'])(t).hex();
  }
  return new THREE.Color(hex);
};

export const getPaletteGradient = (p: string): string => {
  if (p === 'thermal') return '#0000ff, #00ffff, #ffff00, #ff0000';
  if (p === 'viridis') return '#440154, #3b528b, #21908c, #5dc963, #fde725';
  if (p === 'plasma') return '#0d0887, #7e03a8, #cc4778, #f89540, #f0f921';
  return '#08306b, #2171b5, #6baed6, #c6dbef';
};
