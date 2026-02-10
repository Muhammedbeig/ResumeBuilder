"use client";

import { useEffect, useState } from "react";
import type { PanelTemplate, TemplateType } from "@/lib/panel-templates";
import { fetchTemplateById } from "@/lib/template-client";

export function usePanelTemplate(
  type: TemplateType,
  templateId?: string | null,
  enabled: boolean = true
) {
  const [template, setTemplate] = useState<PanelTemplate | null>(null);

  useEffect(() => {
    let isActive = true;
    if (!enabled || !templateId) {
      setTemplate(null);
      return () => {
        isActive = false;
      };
    }

    fetchTemplateById(type, templateId)
      .then((data) => {
        if (!isActive) return;
        setTemplate(data);
      })
      .catch(() => {
        if (!isActive) return;
        setTemplate(null);
      });

    return () => {
      isActive = false;
    };
  }, [type, templateId, enabled]);

  return template;
}