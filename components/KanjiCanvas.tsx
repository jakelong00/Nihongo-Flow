
import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';

interface KanjiCanvasProps {
  onClear?: () => void;
}

export const KanjiCanvas: React.FC<KanjiCanvasProps> = ({ onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Reset context properties after resize
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#4A4E69';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Save state for undo
    if (canvas) {
      setHistory(prev => [...prev, canvas.toDataURL()]);
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      if (onClear) onClear();
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const lastState = history[history.length - 1];
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(prev => prev.slice(0, -1));
    };
  };

  return (
    <div className="relative w-full h-full bg-[#FAF9F6] rounded-[32px] border-4 border-[#4A4E69]/5 overflow-hidden shadow-inner group">
      {/* Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#4A4E69 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05]">
        <div className="w-full h-[1px] bg-[#4A4E69]"></div>
        <div className="absolute w-[1px] h-full bg-[#4A4E69]"></div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="relative z-10 w-full h-full cursor-crosshair touch-none"
      />

      <div className="absolute bottom-6 right-6 z-20 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={undo}
          className="p-3 bg-white text-[#4A4E69]/40 hover:text-[#78A2CC] rounded-2xl shadow-lg border border-[#4A4E69]/5 transition-all active:scale-95"
          title="Undo"
        >
          <Undo2 size={20} />
        </button>
        <button 
          onClick={clearCanvas}
          className="p-3 bg-white text-[#4A4E69]/40 hover:text-[#FFB7C5] rounded-2xl shadow-lg border border-[#4A4E69]/5 transition-all active:scale-95"
          title="Clear"
        >
          <Eraser size={20} />
        </button>
      </div>
    </div>
  );
};
