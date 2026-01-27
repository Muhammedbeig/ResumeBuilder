"use client";

import { useEffect } from "react";
import { useResume } from "@/contexts/ResumeContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultSectionOrder } from "@/lib/resume-data";

export function SectionManager() {
  const { resumeData, updateStructure } = useResume();
  const sections = resumeData.structure || [];

  // Auto-initialize structure if missing (Self-healing)
  useEffect(() => {
    if (!sections || sections.length === 0) {
      updateStructure(defaultSectionOrder);
    }
  }, [sections, updateStructure]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      
      const newSections = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({
          ...s,
          order: idx
      }));

      updateStructure(newSections);
    }
  }

  const toggleVisibility = (id: string) => {
    const updatedSections = sections.map((s) =>
      s.id === id ? { ...s, isVisible: !s.isVisible } : s
    );
    updateStructure(updatedSections);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
          <Layout className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Rearrange Sections
          </h3>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Drag to reorder. Click eye to toggle visibility.
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableItem
                key={section.id}
                id={section.id}
                section={section}
                onToggle={() => toggleVisibility(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableItem(props: { id: string; section: any; onToggle: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className={`font-medium text-sm transition-colors ${props.section.isVisible ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
          {props.section.title}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={props.onToggle}
        className={`h-8 w-8 ${props.section.isVisible ? "text-gray-500 hover:text-purple-600" : "text-gray-300 hover:text-gray-500"}`}
      >
        {props.section.isVisible ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
