import React, { useRef, useEffect, useState } from 'react';
import { RotateCw, Sparkles, Compass } from 'lucide-react';

interface Gemstone3DViewerProps {
  color: 'gold' | 'amethyst' | 'blue' | 'green' | 'diamond';
  cut: 'Round Brilliant' | 'Cushion Cut' | 'Ideal Round Brilliant' | 'Pear Brilliant' | 'Hexagonal Emerald Cut' | string;
  isFullscreen?: boolean;
}

export default function Gemstone3DViewer({ color, cut, isFullscreen = false }: Gemstone3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Custom colors for luxury reflections
  const getColors = () => {
    switch (color) {
      case 'amethyst':
        return {
          primary: 'rgba(92, 46, 84, 0.45)', // Amethyst
          wireframe: '#E8D5B0', // Gold wire
          glow: 'rgba(92, 46, 84, 0.1)',
          facetSpecular: 'rgba(232, 213, 176, 0.5)',
          facets: ['rgba(92, 46, 84, 0.5)', 'rgba(56, 25, 50, 0.65)', 'rgba(26, 12, 24, 0.8)']
        };
      case 'blue':
        return {
          primary: 'rgba(48, 148, 178, 0.45)', // Lagoon blue
          wireframe: '#FAF7F2',
          glow: 'rgba(48, 148, 178, 0.12)',
          facetSpecular: 'rgba(255, 255, 255, 0.5)',
          facets: ['rgba(48, 148, 178, 0.5)', 'rgba(16, 80, 110, 0.65)', 'rgba(5, 40, 60, 0.8)']
        };
      case 'green':
        return {
          primary: 'rgba(30, 120, 80, 0.45)', // Emerald green
          wireframe: '#C9A96E',
          glow: 'rgba(30, 120, 80, 0.1)',
          facetSpecular: 'rgba(232, 213, 176, 0.45)',
          facets: ['rgba(30, 120, 80, 0.5)', 'rgba(15, 75, 50, 0.65)', 'rgba(5, 35, 20, 0.8)']
        };
      case 'gold':
        return {
          primary: 'rgba(201, 169, 110, 0.4)', // Champagne Gold
          wireframe: '#E8D5B0',
          glow: 'rgba(201, 169, 110, 0.08)',
          facetSpecular: 'rgba(255, 255, 255, 0.5)',
          facets: ['rgba(201, 169, 110, 0.4)', 'rgba(168, 137, 85, 0.55)', 'rgba(120, 95, 55, 0.7)']
        };
      case 'diamond':
      default:
        return {
          primary: 'rgba(230, 240, 255, 0.45)', // Pure diamond
          wireframe: '#8A95A5', // Silver wire for contrast
          glow: 'rgba(200, 220, 255, 0.1)',
          facetSpecular: 'rgba(255, 255, 255, 0.85)',
          facets: ['rgba(245, 250, 255, 0.65)', 'rgba(210, 225, 245, 0.75)', 'rgba(170, 190, 220, 0.85)']
        };
    }
  };

  const drawGem = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Apply soft glow behind gemstone
    const palette = getColors();
    const radialGlow = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, 140);
    radialGlow.addColorStop(0, palette.glow);
    radialGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Project 3D coordinate array to 2D
    const project = (x: number, y: number, z: number) => {
      // Rotate around X-axis
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      let y1 = y * cosX - z * sinX;
      let z1 = y * sinX + z * cosX;

      // Rotate around Y-axis
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      let x2 = x * cosY + z1 * sinY;
      let z2 = -x * sinY + z1 * cosY;

      // Scale and project to center
      const scale = 120 / (120 + z2 * 0.1); // subtle perspective
      const screenX = width / 2 + x2 * 1.2 * scale;
      const screenY = height / 2 + y1 * 1.2 * scale;

      return { x: screenX, y: screenY, depth: z2 };
    };

    // Build Gemstone Vertices (Upper table, girdle, pavilion tip)
    let vertices: { x: number; y: number; z: number }[] = [];
    const isRound = cut.includes('Round') || cut.includes('Brilliant');
    const isEmerald = cut.includes('Emerald') || cut.includes('Hexagonal');

    if (isRound) {
      // 8-fold circular symmetry
      const numPoints = 8;
      // Table (Top ring)
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints;
        vertices.push({ x: Math.cos(angle) * 45, y: -25, z: Math.sin(angle) * 45 });
      }
      // Girdle (Middle ring)
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints;
        vertices.push({ x: Math.cos(angle) * 75, y: 5, z: Math.sin(angle) * 75 });
      }
      // Pavilion (Bottom single point)
      vertices.push({ x: 0, y: 65, z: 0 });
    } else if (isEmerald) {
      // Hexagonal bevel cut
      const numPoints = 6;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints;
        vertices.push({ x: Math.cos(angle) * 50, y: -25, z: Math.sin(angle) * 35 });
      }
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints;
        vertices.push({ x: Math.cos(angle) * 75, y: 5, z: Math.sin(angle) * 55 });
      }
      vertices.push({ x: 0, y: 60, z: 0 });
    } else {
      // Cushion Cut (rounded square symmetry)
      const numPoints = 4;
      // Inner cushion ring
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints + Math.PI / 4;
        vertices.push({ x: Math.cos(angle) * 55, y: -20, z: Math.sin(angle) * 55 });
      }
      // Outer girdle cushion ring
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints + Math.PI / 4;
        vertices.push({ x: Math.cos(angle) * 80, y: 5, z: Math.sin(angle) * 80 });
      }
      // Corner beads
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * Math.PI * 2) / numPoints;
        vertices.push({ x: Math.cos(angle) * 72, y: 5, z: Math.sin(angle) * 72 });
      }
      // Culet tip
      vertices.push({ x: 0, y: 65, z: 0 });
    }

    // Connect vertices to form facets
    const projected = vertices.map(v => project(v.x, v.y, v.z));

    const drawFacet = (indices: number[], colorIndex: number) => {
      // Backface culling: only draw if facet is facing us
      // Compute cross product of first three vertices in screen coords
      const p1 = projected[indices[0]];
      const p2 = projected[indices[1]];
      const p3 = projected[indices[2]];
      const v1x = p2.x - p1.x;
      const v1y = p2.y - p1.y;
      const v2x = p3.x - p1.x;
      const v2y = p3.y - p1.y;
      const cross = v1x * v2y - v1y * v2x;

      if (cross < 0) return; // Cull back-facing facets

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      for (let i = 1; i < indices.length; i++) {
        ctx.lineTo(projected[indices[i]].x, projected[indices[i]].y);
      }
      ctx.closePath();

      // Shading based on orientation and depth
      const colorBase = palette.facets[colorIndex % palette.facets.length];
      const alpha = 0.55 + Math.abs(cross) / (width * height * 0.15); // sparkle intensity based on tilt
      
      ctx.fillStyle = colorBase;
      ctx.fill();

      // Gleaming specularity lines (Subdued)
      if (Math.abs(cross) > (width * height * 0.12)) {
        ctx.strokeStyle = palette.facetSpecular;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else {
        ctx.strokeStyle = palette.wireframe;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
    };

    // Draw Facets
    if (isRound) {
      // Draw Table facets
      drawFacet([0, 1, 2, 3, 4, 5, 6, 7], 0);

      // Crown facets (triangles and kites connecting table to girdle)
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        drawFacet([i, next, next + 8, i + 8], i + 1);
      }

      // Pavilion facets (connecting girdle to culet)
      const culetIndex = 16;
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        drawFacet([i + 8, next + 8, culetIndex], i + 2);
      }
    } else if (isEmerald) {
      // Emerald Table
      drawFacet([0, 1, 2, 3, 4, 5], 0);

      // Crown steps
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        drawFacet([i, next, next + 6, i + 6], i + 1);
      }

      // Pavilion steps
      const culetIndex = 12;
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6;
        drawFacet([i + 6, next + 6, culetIndex], i + 2);
      }
    } else {
      // Cushion Cut Facet definitions
      drawFacet([0, 1, 2, 3], 0);
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        drawFacet([i, next, next + 4, i + 4], i + 1);
        drawFacet([i + 4, next + 4, 8 + i], i + 2);
      }
      const culetIndex = 12;
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        drawFacet([8 + i, 8 + next, culetIndex], i + 3);
      }
    }

    // Draw little floating spark particles
    const time = Date.now() * 0.001;
    ctx.fillStyle = '#FAF7F2';
    for (let i = 0; i < 4; i++) {
      const angle = time + i * (Math.PI / 2);
      const px = width / 2 + Math.cos(angle) * 110 * Math.sin(time * 0.5);
      const py = height / 2 + Math.sin(angle) * 110;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    drawGem();
  }, [rotation, color, cut]);

  // Handle drag interaction for custom manual rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: prev.x + dy * 0.015,
      y: prev.y + dx * 0.015
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Slowly auto-rotate in background when not dragging
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setRotation(prev => ({
        ...prev,
        y: prev.y + 0.005
      }));
    }, 40);
    return () => clearInterval(interval);
  }, [isDragging]);

  return (
    <div className={`flex flex-col items-center justify-center relative overflow-hidden group select-none ${isFullscreen ? 'w-full h-[100dvh] bg-transparent' : 'bg-[#FAF7F2] border border-[#C9A96E]/10 p-6 rounded-lg'}`}>
      
      {/* HUD overlay for luxury precision */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 font-mono text-[8px] tracking-[0.2em] text-[#8A7F7A] uppercase">
        <Compass size={10} className="text-[#C9A96E]" />
        <span>360° Viewing Room</span>
      </div>

      <div className="absolute top-4 right-4 flex items-center space-x-1 font-mono text-[8px] tracking-[0.2em] text-[#C9A96E] uppercase">
        <Sparkles size={10} />
        <span>Interactive Facets</span>
      </div>

      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`cursor-grab active:cursor-grabbing max-w-full drop-shadow-[0_20px_50px_rgba(56,25,50,0.08)] ${isFullscreen ? 'w-[600px] h-[600px] max-h-[80vh] object-contain' : ''}`}
      />

      <div className="mt-4 flex items-center space-x-2 font-mono text-[8px] tracking-[0.15em] text-[#8A7F7A] uppercase">
        <RotateCw size={10} className="animate-spin-slow text-[#C9A96E]" />
        <span>Drag to rotate & examine geometric alignments</span>
      </div>
    </div>
  );
}
