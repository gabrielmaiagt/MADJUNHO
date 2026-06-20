"use client";

import React, { useState, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DraggableItem = {
  id: string;
  content: string;
};

type DraggableListProps = {
  items: DraggableItem[];
  onOrderChange: (items: DraggableItem[]) => void;
  disabled?: boolean;
};

export function DraggableList({ items, onOrderChange, disabled = false }: DraggableListProps) {
  const [listItems, setListItems] = useState<DraggableItem[]>([]);
  const draggedItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Update internal state if the external items prop changes
  useEffect(() => {
    setListItems(items);
  }, [items]);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    if (disabled) return;
    draggedItem.current = index;
    // Add a slight delay to allow the browser to render the drag image
    setTimeout(() => {
        e.currentTarget.classList.add('opacity-50', 'bg-primary/20', 'border-primary');
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    if (disabled) return;
    dragOverItem.current = index;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
    if (disabled) return;
    e.currentTarget.classList.remove('opacity-50', 'bg-primary/20', 'border-primary');
    if (draggedItem.current !== null && dragOverItem.current !== null && draggedItem.current !== dragOverItem.current) {
      const newList = [...listItems];
      const [reorderedItem] = newList.splice(draggedItem.current, 1);
      newList.splice(dragOverItem.current, 0, reorderedItem);
      onOrderChange(newList);
    }
    draggedItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <ul className="space-y-3">
      {listItems.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg border bg-muted/50 transition-all",
            !disabled && "cursor-grab active:cursor-grabbing",
          )}
          draggable={!disabled}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()} // Necessary to allow dropping
        >
          <GripVertical className={cn("h-5 w-5 text-muted-foreground", disabled && "opacity-50")} />
          <span className="flex-1 text-foreground">{item.content}</span>
        </li>
      ))}
    </ul>
  );
}
