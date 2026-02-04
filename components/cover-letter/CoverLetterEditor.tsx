"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCoverLetter } from "@/contexts/CoverLetterContext";
import { usePlanChoice } from "@/contexts/PlanChoiceContext";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Save, Download, Image as ImageIcon, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DesignControls } from "@/components/editor/DesignControls";
import { RichTextarea } from "@/components/editor/RichTextarea";
import { COVER_LETTER_DEFAULT_FONTS } from "@/lib/template-defaults";
import { useElementSize } from "@/hooks/use-element-size";
import { PlanChoiceModal } from "@/components/plan/PlanChoiceModal";
import { DownloadGateModal } from "@/components/payments/DownloadGateModal";
import { toast } from "sonner";

export function CoverLetterEditor() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { planChoice } = usePlanChoice();
  const { currentCoverLetter, coverLetterData, updatePersonalInfo, updateRecipientInfo, updateContent, updateMetadata, saveCoverLetter } = useCoverLetter();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [zoom, setZoom] = useState([80]);
  const [advancedFormatting, setAdvancedFormatting] = useState(false);
  const hasSubscription =
    session?.user?.subscription === "pro" || session?.user?.subscription === "business";
  const { ref: previewContainerRef, size: previewContainerSize } =
    useElementSize<HTMLDivElement>();
  const { ref: mobilePreviewRef, size: mobilePreviewSize } =
    useElementSize<HTMLDivElement>();

  const PAGE_WIDTH = 816;
  const PAGE_HEIGHT = 1056;

  const getPreviewScale = (availableWidth?: number) => {
    const zoomScale = zoom[0] / 100;
    return zoomScale;
  };

  useEffect(() => {
    if (planChoice) {
      setIsPlanModalOpen(false);
    }
  }, [planChoice]);

  const syncSubscription = async () => {
    try {
      const response = await fetch("/api/user/subscription");
      if (!response.ok) return;
      const data = await response.json();
      if (updateSession) {
        await updateSession({
          subscription: data.subscription ?? "free",
          subscriptionPlanId: data.subscriptionPlanId ?? null,
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("stripe");
    if (!status) return;
    if (status === "success") {
      setIsDownloadModalOpen(true);
      syncSubscription();
      toast.success("Payment successful.");
    } else if (status === "cancel") {
      toast.info("Payment canceled.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  if (!currentCoverLetter) return null;

  const TemplateComponent = coverLetterTemplates.find(t => t.id === currentCoverLetter.template)?.component || coverLetterTemplates[0].component;
  const exportElementId = "cl-preview-export";

  const PreviewDocument = ({
    elementId,
    withScale = true,
    maxWidth,
  }: {
    elementId: string;
    withScale?: boolean;
    maxWidth?: number;
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(PAGE_HEIGHT);

    useEffect(() => {
      if (!withScale) return;
      const element = contentRef.current;
      if (!element) return;

      const updateHeight = () => {
        setContentHeight(element.scrollHeight || PAGE_HEIGHT);
      };

      updateHeight();
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(element);
      return () => observer.disconnect();
    }, [withScale]);

    const scale = withScale ? getPreviewScale(maxWidth) : 1;
    const scaledWidth = PAGE_WIDTH * scale;
    const scaledHeight = contentHeight * scale;

    return (
      <div
        className={withScale ? "overflow-hidden" : undefined}
        style={withScale ? { width: scaledWidth, height: scaledHeight } : undefined}
      >
        <div
          className={withScale ? "transition-transform duration-200" : undefined}
          style={
            withScale
              ? {
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: PAGE_WIDTH,
                }
              : undefined
          }
        >
          <div ref={contentRef} id={elementId} className="bg-white shadow-2xl min-h-[1056px] w-[816px]">
            <TemplateComponent data={coverLetterData} />
          </div>
        </div>
      </div>
    );
  };

  const openPlanModal = () => {
    if (!session?.user) return;
    setIsPlanModalOpen(true);
  };

  const ensurePlanChosen = () => {
    if (!session?.user) return true;
    if (!planChoice) {
      toast.info("Select a plan to continue.");
      openPlanModal();
      return false;
    }
    return true;
  };

  const openDownloadModal = () => {
    if (!ensurePlanChosen()) return;
    if (planChoice === "paid" && !hasSubscription) {
      router.push(
        `/pricing?flow=download&returnUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    setIsDownloadModalOpen(true);
  };

  const handleSave = async () => {
    if (!session?.user && currentCoverLetter.id.startsWith("local-")) {
        await saveCoverLetter();
        return;
    }
    if (!session?.user) {
        toast.error("Please sign in to save to cloud");
        router.push(`/login?callbackUrl=${window.location.pathname}`);
        return;
    }
    setIsSaving(true);
    try {
      await saveCoverLetter();
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    openDownloadModal();
  };

  const handleExportImage = () => {
    openDownloadModal();
  };

  return (
    <>
      <PlanChoiceModal open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen} />
      <DownloadGateModal
        open={isDownloadModalOpen}
        onOpenChange={setIsDownloadModalOpen}
        planChoice={planChoice}
        hasSubscription={!!hasSubscription}
      />
      <div className="flex h-full flex-col lg:flex-row overflow-hidden relative">
      {/* Editor Side (Left) */}
      <div className="w-full lg:w-1/2 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">Editor</h2>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-none p-0">
                <div className="h-full bg-gray-100 dark:bg-gray-950 overflow-y-auto overflow-x-auto">
                  <div
                    ref={mobilePreviewRef}
                    className="w-full flex flex-col p-4"
                  >
                    <div className="w-full max-w-[816px] mx-auto flex items-center justify-between mb-4 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                      <span className="text-xs font-medium text-gray-500 px-2">Preview Zoom</span>
                      <div className="flex items-center gap-4 w-48 px-2">
                        <span className="text-xs text-gray-400 w-8">{zoom[0]}%</span>
                        <Slider value={zoom} onValueChange={setZoom} min={50} max={150} step={5} />
                      </div>
                    </div>
                    <div className="min-w-max w-full flex justify-center">
                      <PreviewDocument
                        elementId="cl-preview-mobile"
                        maxWidth={mobilePreviewSize.width}
                      />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportImage} disabled={isExporting}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Image
            </Button>
            <Button size="sm" onClick={handleExportPDF} disabled={isExporting} className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personal" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
             <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="recipient">Recipient</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="personal" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={coverLetterData.personalInfo.fullName} onChange={(e) => updatePersonalInfo({ fullName: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={coverLetterData.personalInfo.email} onChange={(e) => updatePersonalInfo({ email: e.target.value })} placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={coverLetterData.personalInfo.phone} onChange={(e) => updatePersonalInfo({ phone: e.target.value })} placeholder="+1..." />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={coverLetterData.personalInfo.city} onChange={(e) => updatePersonalInfo({ city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input value={coverLetterData.personalInfo.zipCode} onChange={(e) => updatePersonalInfo({ zipCode: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={coverLetterData.personalInfo.address} onChange={(e) => updatePersonalInfo({ address: e.target.value })} />
                </div>
                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving ? "Saving..." : "Save Progress"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recipient" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label>Manager Name</Label>
                  <Input value={coverLetterData.recipientInfo.managerName} onChange={(e) => updateRecipientInfo({ managerName: e.target.value })} placeholder="Hiring Manager Name" />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={coverLetterData.recipientInfo.companyName} onChange={(e) => updateRecipientInfo({ companyName: e.target.value })} placeholder="Target Company" />
                </div>
                 <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input value={coverLetterData.recipientInfo.email} onChange={(e) => updateRecipientInfo({ email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={coverLetterData.recipientInfo.address} onChange={(e) => updateRecipientInfo({ address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={coverLetterData.recipientInfo.city} onChange={(e) => updateRecipientInfo({ city: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    <Input value={coverLetterData.recipientInfo.zipCode} onChange={(e) => updateRecipientInfo({ zipCode: e.target.value })} />
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving ? "Saving..." : "Save Progress"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="content" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  {advancedFormatting ? (
                    <RichTextarea
                      value={coverLetterData.content.subject}
                      onValueChange={(value) => updateContent({ subject: value })}
                      placeholder="e.g. Application for Software Engineer position"
                      rows={1}
                      enableFormatting
                    />
                  ) : (
                    <Input
                      value={coverLetterData.content.subject}
                      onChange={(e) => updateContent({ subject: e.target.value })}
                      placeholder="e.g. Application for Software Engineer position"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Greeting</Label>
                  {advancedFormatting ? (
                    <RichTextarea
                      value={coverLetterData.content.greeting}
                      onValueChange={(value) => updateContent({ greeting: value })}
                      rows={1}
                      enableFormatting
                    />
                  ) : (
                    <Input
                      value={coverLetterData.content.greeting}
                      onChange={(e) => updateContent({ greeting: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Opening Paragraph</Label>
                  <RichTextarea
                    className="min-h-32"
                    value={coverLetterData.content.opening}
                    onValueChange={(value) => updateContent({ opening: value })}
                    placeholder="How did you find the job? Why are you interested?"
                    enableFormatting
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body Paragraphs</Label>
                  <RichTextarea
                    className="min-h-64"
                    value={coverLetterData.content.body}
                    onValueChange={(value) => updateContent({ body: value })}
                    placeholder="Highlight your key achievements and match them to job requirements."
                    enableFormatting
                  />
                </div>
                <div className="space-y-2">
                  <Label>Closing</Label>
                  {advancedFormatting ? (
                    <RichTextarea
                      value={coverLetterData.content.closing}
                      onValueChange={(value) => updateContent({ closing: value })}
                      rows={1}
                      enableFormatting
                    />
                  ) : (
                    <Input
                      value={coverLetterData.content.closing}
                      onChange={(e) => updateContent({ closing: e.target.value })}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Signature</Label>
                  {advancedFormatting ? (
                    <RichTextarea
                      value={coverLetterData.content.signature}
                      onValueChange={(value) => updateContent({ signature: value })}
                      rows={1}
                      enableFormatting
                    />
                  ) : (
                    <Input
                      value={coverLetterData.content.signature}
                      onChange={(e) => updateContent({ signature: e.target.value })}
                    />
                  )}
                </div>
                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving ? "Saving..." : "Save Progress"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="design" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full">
              <div className="p-6 pb-6">
                <DesignSection
                  templateId={currentCoverLetter.template}
                  advancedFormatting={advancedFormatting}
                  onAdvancedFormattingChange={setAdvancedFormatting}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Side (Right) */}
      <div className="hidden lg:flex w-1/2 bg-gray-100 dark:bg-gray-950 flex-col">
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Preview</span>
          <div className="flex items-center gap-4 w-48">
            <span className="text-xs text-gray-400 w-8">{zoom[0]}%</span>
            <Slider value={zoom} onValueChange={setZoom} min={50} max={150} step={5} />
          </div>
        </div>
      <div className="flex-1 w-full overflow-y-auto overflow-x-auto p-8">
          <div ref={previewContainerRef} className="w-full">
            <div className="min-w-max w-full flex justify-center">
              <PreviewDocument
                elementId="cl-preview-view"
                maxWidth={previewContainerSize.width}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offscreen preview for mobile export */}
      <div className="absolute -left-[9999px] top-0">
        <PreviewDocument elementId={exportElementId} withScale={false} />
      </div>
    </div>
    </>
  );
}

function DesignSection({
  templateId,
  advancedFormatting,
  onAdvancedFormattingChange,
}: {
  templateId: string;
  advancedFormatting: boolean;
  onAdvancedFormattingChange: (value: boolean) => void;
}) {
  const { coverLetterData, updateMetadata } = useCoverLetter();
  const defaultFont = COVER_LETTER_DEFAULT_FONTS[templateId] || "Inter";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Design & Appearance
        </h2>
        <DesignControls
          metadata={coverLetterData.metadata}
          onUpdate={updateMetadata}
          defaultFontLabel={defaultFont}
          advancedFormattingEnabled={advancedFormatting}
          onAdvancedFormattingChange={onAdvancedFormattingChange}
        />
      </div>
    </div>
  );
}
