"use client";

import { useRef, useState } from "react";
import { MOCK_RESUME } from "@/lib/mock-resume";
import { resumeTemplateMap } from "@/lib/resume-templates";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function ResumePreviewPage() {
  const [templateId, setTemplateId] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Get the component for the selected template
  const TemplateComponent = resumeTemplateMap[templateId as keyof typeof resumeTemplateMap];

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const exportHtml = exportRef.current?.innerHTML;
      if (!exportHtml) {
        throw new Error("Unable to capture resume HTML for export.");
      }
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: exportHtml,
          data: MOCK_RESUME.data,
          templateId,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${templateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert("Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Preview (No DB)</h1>
          <div className="flex gap-4 items-center">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Template" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(resumeTemplateMap).map((id) => (
                  <SelectItem key={id} value={id}>
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Download PDF"
              )}
            </Button>
            {isGenerating && (
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Exporting PDF… this can take 10–15s.
              </span>
            )}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden min-h-[1000px]">
          {TemplateComponent ? (
            <div ref={exportRef} id="resume-export">
              <TemplateComponent data={MOCK_RESUME.data} />
            </div>
          ) : (
            <div className="p-8 text-center text-red-500">Template not found</div>
          )}
        </div>
      </div>
    </div>
  );
}
