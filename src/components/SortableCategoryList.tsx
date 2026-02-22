import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";

const modifiers = [restrictToVerticalAxis, restrictToParentElement];

interface SortableCategoryListProps {
  items: any[];
  onReorder: (items: any[]) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  containerId: string;
}

function SortableItem({
  id,
  children,
  isActive,
}: {
  id: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: null,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function SortableCategoryList({
  items,
  onReorder,
  renderItem,
  containerId,
}: SortableCategoryListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Long-press activation: delay 250ms, tolerance 5px
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = items.map((_, i) => `${containerId}-${i}`);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    // Haptic feedback if available
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove([...items], oldIndex, newIndex));
  }, [ids, items, onReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeIndex = activeId ? ids.indexOf(activeId) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={modifiers}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-px">
          {items.map((cat, i) => (
            <SortableItem key={ids[i]} id={ids[i]} isActive={activeId === ids[i]}>
              {renderItem(cat, i)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeIndex >= 0 ? (
          <div className="scale-[1.03] shadow-xl shadow-primary/10 rounded-xl ring-2 ring-primary/20 animate-scale-in">
            {renderItem(items[activeIndex], activeIndex)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
