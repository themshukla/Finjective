import { useState, useRef, useCallback, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const THRESHOLD = 60;

const PullToRefresh = ({ onRefresh, children, className, style }: PullToRefreshProps) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (refreshing) return;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    setPulling(false);
  }, [pullDistance, onRefresh, refreshing]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex justify-center items-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <RefreshCw
          className={`h-5 w-5 text-primary transition-transform ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: `rotate(${Math.min(pullDistance / THRESHOLD, 1) * 360}deg)` }}
        />
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
