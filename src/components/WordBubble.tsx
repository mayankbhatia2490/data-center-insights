import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const WordBubble = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 200 });

  const { data: words, isLoading } = useQuery({
    queryKey: ["word-bubble"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("word-bubble");
      if (error) throw error;
      return data as { word: string; count: number }[];
    },
    refetchInterval: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!words || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions
    const container = canvas.parentElement;
    if (container) {
      const w = container.clientWidth;
      const h = 200;
      canvas.width = w * 2; // retina
      canvas.height = h * 2;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(2, 2);
      setDimensions({ width: w, height: h });
    }

    // Clear
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Simple word cloud rendering
    const maxCount = Math.max(...words.map((w) => w.count), 1);
    const colors = [
      "hsl(200, 98%, 39%)", // primary
      "hsl(160, 84%, 39%)", // accent
      "hsl(217, 91%, 60%)", // blue
      "hsl(35, 92%, 55%)",  // orange
      "hsl(215, 16%, 47%)", // muted
    ];

    // Place words in a spiral pattern
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    for (let i = 0; i < Math.min(words.length, 40); i++) {
      const word = words[i];
      const fontSize = 10 + (word.count / maxCount) * 18;
      ctx.font = `${i < 5 ? "800" : "600"} ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = colors[i % colors.length];

      const metrics = ctx.measureText(word.word);
      const textW = metrics.width + 4;
      const textH = fontSize + 4;

      // Spiral placement
      let angle = 0;
      let radius = 0;
      let x = centerX;
      let y = centerY;
      let placed_ok = false;

      for (let step = 0; step < 500; step++) {
        angle = step * 0.3;
        radius = step * 1.2;
        x = centerX + Math.cos(angle) * radius - textW / 2;
        y = centerY + Math.sin(angle) * radius + textH / 3;

        if (x < 0 || y < 8 || x + textW > dimensions.width || y > dimensions.height - 4) continue;

        const overlap = placed.some(
          (p) => !(x + textW < p.x || x > p.x + p.w || y - textH > p.y || y < p.y - p.h)
        );

        if (!overlap) {
          placed_ok = true;
          break;
        }
      }

      if (placed_ok) {
        ctx.fillText(word.word, x, y);
        placed.push({ x, y: y - textH, w: textW, h: textH });
      }
    }
  }, [words, dimensions.width]);

  if (isLoading) {
    return (
      <div className="border-b border-border pb-8 mb-8">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!words || words.length === 0) return null;

  return (
    <div className="border-b border-border pb-8 mb-8">
      <h3 className="flex items-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted-foreground mb-4">
        <span className="w-[2px] h-4 bg-primary mr-2 shrink-0" />
        Trending Topics
      </h3>
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
};

export default WordBubble;
