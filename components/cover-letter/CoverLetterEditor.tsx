"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCoverLetter } from "@/contexts/CoverLetterContext";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Save, Download, Image as ImageIcon, ChevronLeft, ChevronRight, Palette } from "lucide-react";
import { generateImage, generatePDF, downloadImage } from "@/lib/pdf";
import { toast } from "sonner";

export function CoverLetterEditor() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentCoverLetter, coverLetterData, updatePersonalInfo, updateRecipientInfo, updateContent, updateMetadata, saveCoverLetter } = useCoverLetter();
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState([80]);

  if (!currentCoverLetter) return null;

  const TemplateComponent = coverLetterTemplates.find(t => t.id === currentCoverLetter.template)?.component || coverLetterTemplates[0].component;

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

  const handleExportPDF = async () => {
    if (!session?.user) {
      toast.error("Please sign in to export");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    setIsExporting(true);
    try {
      const pdfUrl = await generatePDF('cl-preview', 'cover-letter.pdf');
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'cover-letter.pdf';
      link.click();
      toast.success('Exported successfully!');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!session?.user) {
      toast.error("Please sign in to export");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    setIsExporting(true);
    try {
      const imageUrl = await generateImage('cl-preview');
      downloadImage(imageUrl, 'cover-letter.png');
      toast.success('Exported successfully!');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-96px)] overflow-hidden">
      {/* Editor Side (Left) */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">Editor</h2>
          <div className="flex items-center gap-2">
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
              <div className="p-6 pb-32 space-y-4">
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
              <div className="p-6 pb-32 space-y-4">
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
              <div className="p-6 pb-32 space-y-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input value={coverLetterData.content.subject} onChange={(e) => updateContent({ subject: e.target.value })} placeholder="e.g. Application for Software Engineer position" />
                </div>
                <div className="space-y-2">
                  <Label>Greeting</Label>
                  <Input value={coverLetterData.content.greeting} onChange={(e) => updateContent({ greeting: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Opening Paragraph</Label>
                  <Textarea className="min-h-32" value={coverLetterData.content.opening} onChange={(e) => updateContent({ opening: e.target.value })} placeholder="How did you find the job? Why are you interested?" />
                </div>
                <div className="space-y-2">
                  <Label>Body Paragraphs</Label>
                  <Textarea className="min-h-64" value={coverLetterData.content.body} onChange={(e) => updateContent({ body: e.target.value })} placeholder="Highlight your key achievements and match them to job requirements." />
                </div>
                <div className="space-y-2">
                  <Label>Closing</Label>
                  <Input value={coverLetterData.content.closing} onChange={(e) => updateContent({ closing: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Signature</Label>
                  <Input value={coverLetterData.content.signature} onChange={(e) => updateContent({ signature: e.target.value })} />
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
              <div className="p-6 pb-32">
                <DesignSection />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Side (Right) */}
      <div className="w-1/2 bg-gray-100 dark:bg-gray-950 p-8 overflow-auto flex flex-col items-center">
        <div className="w-full max-w-[816px] flex items-center justify-between mb-4 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <span className="text-xs font-medium text-gray-500 px-2">Preview Zoom</span>
            <div className="flex items-center gap-4 w-48 px-2">
                <span className="text-xs text-gray-400 w-8">{zoom[0]}%</span>
                <Slider value={zoom} onValueChange={setZoom} min={50} max={150} step={5} />
            </div>
        </div>
        
        <div className="transition-transform duration-200" style={{ transform: `scale(${zoom[0] / 100})`, transformOrigin: "top center" }}>
          <div id="cl-preview" className="bg-white shadow-2xl min-h-[1056px] w-[816px]">
            <TemplateComponent data={coverLetterData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignSection() {
  const { coverLetterData, updateMetadata } = useCoverLetter();
  
  const colors = [
    "#000000", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", 
    "#f59e0b", "#ec4899", "#0ea5e9", "#6366f1", "#14b8a6",
  ];

  const fonts = [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway", 
    "Poppins", "Merriweather", "Playfair Display", "Ubuntu", "Nunito", 
    "Rubik", "Lora", "PT Sans", "PT Serif", "Quicksand", "Work Sans", 
    "Fira Sans", "Inconsolata", "Oswald"
  ];

  const fontSizes = [
    { id: "sm", label: "Small" },
    { id: "md", label: "Medium" },
    { id: "lg", label: "Large" },
  ];

  useEffect(() => {
    const font = coverLetterData.metadata?.fontFamily || "Inter";
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [coverLetterData.metadata?.fontFamily]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Design & Appearance
        </h2>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-gray-900 dark:text-white">Accent Color</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateMetadata({ themeColor: color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      coverLetterData.metadata?.themeColor === color 
                        ? "border-gray-900 dark:border-white scale-110" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
                <div className="relative">
                    <input 
                        type="color" 
                        value={coverLetterData.metadata?.themeColor || "#000000"}
                        onChange={(e) => updateMetadata({ themeColor: e.target.value })}
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0"
                    />
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center pointer-events-none">
                        <span className="text-xs">+</span>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
               <div className="flex items-center gap-2 mb-4">
                 <h3 className="font-medium text-gray-900 dark:text-white">Font Size</h3>
               </div>
               <div className="flex gap-2">
                 {fontSizes.map((size) => (
                    <Button
                        key={size.id}
                        variant={coverLetterData.metadata?.fontSize === size.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateMetadata({ fontSize: size.id })}
                        className="flex-1"
                    >
                        {size.label}
                    </Button>
                 ))}
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Font Family</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((font) => (
                  <div
                    key={font}
                    onClick={() => updateMetadata({ fontFamily: font })}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      coverLetterData.metadata?.fontFamily === font
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-600"
                        : "border-gray-200 dark:border-gray-800 hover:border-purple-300"
                    }`}
                  >
                    <div className="font-medium text-sm" style={{ fontFamily: font }}>{font}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
