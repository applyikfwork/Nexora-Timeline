import React, { useEffect, useRef } from 'react';

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    let animationFrameId: number;

    const particles: { x: number; y: number; z: number; size: number }[] = [];
    const particleCount = 400;
    const sphereRadius = Math.min(width, height) * 0.4;

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);
      particles.push({ x, y, z, size: Math.random() * 1.5 + 0.5 });
    }

    let angleX = 0;
    let angleY = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      angleY += 0.002;
      angleX += 0.001;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      particles.forEach((p) => {
        // Rotate Y
        let rotX = p.x * cosY - p.z * sinY;
        let rotZ = p.z * cosY + p.x * sinY;
        
        // Rotate X
        let rotY = p.y * cosX - rotZ * sinX;
        rotZ = rotZ * cosX + p.y * sinX;

        const scale = (sphereRadius + rotZ) / (sphereRadius * 2);
        if (scale > 0) {
          const screenX = width / 2 + rotX;
          const screenY = height / 2 + rotY;

          ctx.beginPath();
          ctx.arc(screenX, screenY, p.size * scale * 2, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(0, 255, 255, ${scale * 0.8})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        className="relative z-10 w-full h-full object-contain"
      />
    </div>
  );
}
