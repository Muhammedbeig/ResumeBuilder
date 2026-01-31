"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Languages,
  Save,
  Download,
  Image as ImageIcon,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Layout,
  MoreHorizontal,
  Palette,
  Share2,
  Copy,
  Globe,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResume } from "@/contexts/ResumeContext";
import { resumeTemplateMap, resumeTemplates } from "@/lib/resume-templates";
import { generateImage, generatePDF, downloadImage } from "@/lib/pdf";
import { SectionManager } from "@/components/editor/SectionManager";
import { toast } from "sonner";
import type { Experience, Education, Project } from "@/types";

export function ResumeEditorPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const { data: session } = useSession();
  const user = session?.user;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    resumeData,
    currentResume,
    updateBasics,
    generateSummaryAI,
    rewriteBulletAI,
    saveResume,
    loadResume,
    updateTemplate,
    isLoading,
    generatePDF: generatePDFContext,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addSkillGroup,
    updateSkillGroup,
    removeSkillGroup,
    addProject,
    updateProject,
    removeProject,
    addCertification,
    removeCertification
  } = useResume();

  const [activeTab, setActiveTab] = useState("basics");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState([90]);

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId);
    }
  }, [resumeId, loadResume]);

  const activeTemplateId = currentResume?.template || "modern";
  const ActiveTemplate =
    resumeTemplateMap[activeTemplateId as keyof typeof resumeTemplateMap] ||
    resumeTemplateMap.modern;

  const handleExportPDF = async () => {
    if (!session?.user) {
      toast.error("Please sign in to export your resume");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    setIsExporting(true);
    try {
      if (generatePDFContext) {
        await generatePDFContext(activeTemplateId);
      } else {
        const pdfUrl = await generatePDF('resume-preview', 'resume.pdf');
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'resume.pdf';
        link.click();
      }
      toast.success('Resume exported successfully!');
    } catch (error) {
      console.error('Export PDF failed:', error);
      toast.error('Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!session?.user) {
      toast.error("Please sign in to export your resume");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    setIsExporting(true);
    try {
      const imageUrl = await generateImage('resume-preview');
      downloadImage(imageUrl, 'resume.png');
      toast.success('Resume exported successfully!');
    } catch (error) {
      console.error('Export Image failed:', error);
      toast.error('Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!currentResume) return;
    
    if (!session?.user && currentResume.id.startsWith("local-")) {
        await saveResume();
        return;
    }

    if (!session?.user) {
      toast.error("Please sign in to save your resume to the cloud");
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }

    setIsSaving(true);
    try {
      await saveResume();
      toast.success("Resume saved!");
    } catch (error) {
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const mainTabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'design', label: 'Design' },
  ];

  const moreTabs = [
    { id: 'projects', label: 'Projects', icon: Code },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'structure', label: 'Rearrange', icon: Layout },
  ];

  return (
    <div className="pt-24">
      <div className="flex h-[calc(100vh-96px)] overflow-hidden">
        {/* Editor Side (Left) */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">Editor</h2>
            <div className="flex items-center gap-2">
              <SharePopover />
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                  <TabsList className="flex-1 grid grid-cols-5">
                    {mainTabs.map(tab => (
                      <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {moreTabs.map(tab => (
                        <DropdownMenuItem 
                          key={tab.id} 
                          onClick={() => setActiveTab(tab.id)}
                          className={activeTab === tab.id ? "bg-accent" : ""}
                        >
                          <tab.icon className="mr-2 h-4 w-4" />
                          {tab.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            </div>

                      <ScrollArea className="flex-1 h-full">
                        <div className="p-6 pb-32">
                          <TabsContent value="basics" className="mt-0 space-y-6">                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h2>
                    
                    <div className="mb-6 flex items-center gap-6">
                      <div className="shrink-0">
                        {resumeData.basics.image ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={resumeData.basics.image} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="relative overflow-hidden"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Upload Photo
                            </span>
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateBasics({ image: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          {resumeData.basics.image && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => updateBasics({ image: '' })}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Recommended: Square JPG, PNG. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input 
                          value={resumeData.basics.name}
                          onChange={(e) => updateBasics({ name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label>Professional Title</Label>
                        <Input 
                          value={resumeData.basics.title}
                          onChange={(e) => updateBasics({ title: e.target.value })}
                          placeholder="Software Engineer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input 
                          type="email"
                          value={resumeData.basics.email}
                          onChange={(e) => updateBasics({ email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input 
                          value={resumeData.basics.phone}
                          onChange={(e) => updateBasics({ phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <Input 
                        value={resumeData.basics.location}
                        onChange={(e) => updateBasics({ location: e.target.value })}
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>LinkedIn</Label>
                        <Input 
                          value={resumeData.basics.linkedin || ''}
                          onChange={(e) => updateBasics({ linkedin: e.target.value })}
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div>
                        <Label>GitHub</Label>
                        <Input 
                          value={resumeData.basics.github || ''}
                          onChange={(e) => updateBasics({ github: e.target.value })}
                          placeholder="github.com/johndoe"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Professional Summary</Label>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => generateSummaryAI()}
                          disabled={isLoading}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate with AI
                        </Button>
                      </div>
                      <Textarea 
                        value={resumeData.basics.summary}
                        onChange={(e) => updateBasics({ summary: e.target.value })}
                        placeholder="Write a brief summary about your professional background and career goals..."
                        rows={4}
                      />
                    </div>
                </TabsContent>

                <TabsContent value="experience" className="mt-0">
                  <ExperienceSection />
                </TabsContent>

                <TabsContent value="education" className="mt-0">
                  <EducationSection />
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <SkillsSection />
                </TabsContent>

                <TabsContent value="design" className="mt-0">
                  <DesignSection />
                </TabsContent>

                <TabsContent value="projects" className="mt-0">
                  <ProjectsSection />
                </TabsContent>

                <TabsContent value="certifications" className="mt-0">
                  <CertificationsSection />
                </TabsContent>

                <TabsContent value="structure" className="mt-0">
                  <SectionManager />
                </TabsContent>
              </div>
            </ScrollArea>
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
            <div id="resume-preview" className="bg-white shadow-2xl min-h-[1056px] w-[816px] text-black">
              <ActiveTemplate 
                key={JSON.stringify(resumeData.structure)} 
                data={resumeData} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
function ExperienceSection() {
  const {
    resumeData,
    addExperience,
    updateExperience,
    removeExperience,
    rewriteBulletAI,
    suggestResponsibilitiesAI,
    generateJobDescriptionAI,
    isLoading,
  } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newExperience, setNewExperience] = useState<Partial<Experience>>({
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    bullets: ['']
  });

  const handleAdd = () => {
    if (newExperience.company && newExperience.role) {
      addExperience(newExperience as Omit<Experience, 'id'>);
      setNewExperience({
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: ['']
      });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="experience"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Work Experience
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Experience
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  placeholder="e.g. Senior Engineer"
                  value={newExperience.role}
                  onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g. New York, NY"
                value={newExperience.location}
                onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <MonthYearPicker
                  date={newExperience.startDate ? new Date(newExperience.startDate) : undefined}
                  onSelect={(date) => setNewExperience({ ...newExperience, startDate: format(date, "MMM yyyy") })}
                  placeholder="Start Date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <MonthYearPicker
                  date={newExperience.endDate && newExperience.endDate !== 'Present' ? new Date(newExperience.endDate) : undefined}
                  onSelect={(date) => setNewExperience({ ...newExperience, endDate: format(date, "MMM yyyy") })}
                  placeholder="End Date"
                  disabled={newExperience.current}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newExperience.current}
                onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">I currently work here</label>
            </div>
            
            <div className="flex justify-end gap-2 mb-2">
                 <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={async () => {
                        if (!newExperience.role) {
                            toast.error("Please enter a Job Title");
                            return;
                        }
                        const desc = await generateJobDescriptionAI(newExperience.role, newExperience.company);
                        if (desc) {
                            setNewExperience(prev => ({ 
                                ...prev, 
                                bullets: [desc, ...(prev.bullets || []).filter(b => b)] 
                            }));
                        }
                    }}
                    className="text-purple-600 text-xs"
                >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generate Description
                </Button>
                 <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={async () => {
                        if (!newExperience.role) {
                            toast.error("Please enter a Job Title");
                            return;
                        }
                        const bullets = await suggestResponsibilitiesAI(newExperience.role, newExperience.company);
                        if (bullets && bullets.length > 0) {
                            setNewExperience(prev => ({ 
                                ...prev, 
                                bullets: [...(prev.bullets || []).filter(b => b), ...bullets]
                            }));
                        }
                    }}
                    className="text-purple-600 text-xs"
                >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Suggest Bullets
                </Button>
            </div>

            <Textarea
              placeholder="Job description and achievements..."
              value={newExperience.bullets?.[0] || ''}
              onChange={(e) => setNewExperience({ ...newExperience, bullets: [e.target.value] })}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Experience</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.experiences.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{exp.role}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {exp.company} - {exp.location}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeExperience(exp.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {exp.bullets.map((bullet, idx) => (
                <div key={idx} className="flex gap-2">
                  <Textarea
                    value={bullet}
                    onChange={(e) => {
                      const newBullets = [...exp.bullets];
                      newBullets[idx] = e.target.value;
                      updateExperience(exp.id, { bullets: newBullets });
                    }}
                    placeholder="Describe your achievement..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rewriteBulletAI(exp.id, idx)}
                    disabled={isLoading}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function EducationSection() {
  const { resumeData, addEducation, updateEducation, removeEducation } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newEducation, setNewEducation] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    gpa: ''
  });

  const handleAdd = () => {
    if (newEducation.institution && newEducation.degree) {
      addEducation(newEducation as Omit<Education, 'id'>);
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="education"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Education
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Education
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                placeholder="Institution Name"
                value={newEducation.institution}
                onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  placeholder="e.g. Bachelor's"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input
                  placeholder="e.g. Computer Science"
                  value={newEducation.field}
                  onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <MonthYearPicker
                  date={newEducation.startDate ? new Date(newEducation.startDate) : undefined}
                  onSelect={(date) => setNewEducation({ ...newEducation, startDate: format(date, "MMM yyyy") })}
                  placeholder="Start"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <MonthYearPicker
                  date={newEducation.endDate && newEducation.endDate !== 'Present' ? new Date(newEducation.endDate) : undefined}
                  onSelect={(date) => setNewEducation({ ...newEducation, endDate: format(date, "MMM yyyy") })}
                  placeholder="End"
                />
              </div>
              <div className="space-y-2">
                <Label>GPA (Optional)</Label>
                <Input
                  placeholder="3.8"
                  value={newEducation.gpa}
                  onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Education</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.education.map((edu) => (
        <Card key={edu.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                  className="font-semibold mb-2"
                />
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    placeholder="Degree"
                  />
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                    placeholder="Field of Study"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    value={edu.startDate}
                    onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                    placeholder="Start Year"
                  />
                  <Input
                    value={edu.endDate}
                    onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                    placeholder="End Year"
                  />
                  <Input
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                    placeholder="GPA"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(edu.id)}
                className="text-red-600 hover:text-red-700 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function SkillsSection() {
  const { resumeData, addSkillGroup, updateSkillGroup, removeSkillGroup, suggestSkillsAI, isLoading } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', skills: '' });

  const handleAdd = () => {
    if (newGroup.name && newGroup.skills) {
      addSkillGroup({
        name: newGroup.name,
        skills: newGroup.skills.split(',').map(s => s.trim()).filter(s => s)
      });
      setNewGroup({ name: '', skills: '' });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="skills"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Skills
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Skill Group
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
             <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={async () => {
                        if (!resumeData.basics.title) {
                            toast.error("Add a Professional Title in Basics first");
                            return;
                        }
                        const result = await suggestSkillsAI(resumeData.basics.title);
                        if (result.hardSkills.length > 0) {
                            setNewGroup({ 
                                name: "Technical Skills", 
                                skills: result.hardSkills.join(", ") 
                            });
                        }
                    }}
                    className="text-purple-600"
                >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Auto-Suggest
                </Button>
             </div>
            <Input
              placeholder="Category Name (e.g., Programming Languages)"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <Textarea
              placeholder="Enter skills separated by commas (e.g., JavaScript, Python, React)"
              value={newGroup.skills}
              onChange={(e) => setNewGroup({ ...newGroup, skills: e.target.value })}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Skills</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.skills.map((group) => (
        <Card key={group.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Input
                value={group.name}
                onChange={(e) => updateSkillGroup(group.id, { name: e.target.value })}
                className="font-semibold max-w-xs"
                placeholder="Category Name"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSkillGroup(group.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function ProjectsSection() {
  const { resumeData, addProject, updateProject, removeProject } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    technologies: [],
    link: '',
    github: ''
  });

  const handleAdd = () => {
    if (newProject.name) {
      addProject(newProject as Omit<Project, 'id'>);
      setNewProject({
        name: '',
        description: '',
        technologies: [],
        link: '',
        github: ''
      });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="projects"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Projects
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Project
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <Input
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <Textarea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Technologies (comma separated)"
              value={newProject.technologies?.join(', ') || ''}
              onChange={(e) => setNewProject({ 
                ...newProject, 
                technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Project Link"
                value={newProject.link || ''}
                onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
              />
              <Input
                placeholder="GitHub Link"
                value={newProject.github || ''}
                onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Project</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Input
                  value={project.name}
                  onChange={(e) => updateProject(project.id, { name: e.target.value })}
                  className="font-semibold mb-2"
                />
                <Textarea
                  value={project.description}
                  onChange={(e) => updateProject(project.id, { description: e.target.value })}
                  placeholder="Project description"
                  rows={3}
                  className="mb-4"
                />
                <Input
                  placeholder="Technologies (comma separated)"
                  value={project.technologies.join(', ')}
                  onChange={(e) => updateProject(project.id, { 
                    technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Project Link"
                    value={project.link || ''}
                    onChange={(e) => updateProject(project.id, { link: e.target.value })}
                  />
                  <Input
                    placeholder="GitHub Link"
                    value={project.github || ''}
                    onChange={(e) => updateProject(project.id, { github: e.target.value })}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProject(project.id)}
                className="text-red-600 hover:text-red-700 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function CertificationsSection() {
  const { resumeData, addCertification, removeCertification } = useResume();
  const [isAdding, setIsAdding] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', link: '' });

  const handleAdd = () => {
    if (newCert.name && newCert.issuer) {
      addCertification(newCert);
      setNewCert({ name: '', issuer: '', date: '', link: '' });
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      key="certifications"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Certifications
        </h2>
        <Button 
          size="sm"
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Certification
        </Button>
      </div>

      {isAdding && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Certification Name"
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              />
              <Input
                placeholder="Issuing Organization"
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date Earned</Label>
                <MonthYearPicker
                  date={newCert.date ? new Date(newCert.date) : undefined}
                  onSelect={(date) => setNewCert({ ...newCert, date: format(date, "MMM yyyy") })}
                  placeholder="Date"
                />
              </div>
              <div className="space-y-2">
                 <Label>Link (Optional)</Label>
                 <Input
                    placeholder="Certificate Link"
                    value={newCert.link}
                    onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
                 />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Certification</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resumeData.certifications.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Input
                  value={cert.name}
                  readOnly
                  className="font-semibold mb-2 bg-gray-50 dark:bg-gray-800"
                  placeholder="Certification Name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={cert.issuer}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                    placeholder="Issuing Organization"
                  />
                  <Input
                    value={cert.date}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                    placeholder="Date Earned"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCertification(cert.id)}
                className="text-red-600 hover:text-red-700 ml-4"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

function DesignSection() {
  const { resumeData, updateMetadata } = useResume();
  
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

  // Dynamically load font
  useEffect(() => {
    const font = resumeData.metadata?.fontFamily || "Inter";
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@300;400;500;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [resumeData.metadata?.fontFamily]);

  return (
    <motion.div
      key="design"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
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
                      resumeData.metadata?.themeColor === color 
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
                        value={resumeData.metadata?.themeColor || "#000000"}
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
                        variant={resumeData.metadata?.fontSize === size.id ? "default" : "outline"}
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
                      resumeData.metadata?.fontFamily === font
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
    </motion.div>
  );
}

function SharePopover() {
  const { currentResume, togglePublic } = useResume();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!currentResume) return null;

  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/shared/${currentResume.id}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Share Resume</h4>
            <div className="flex items-center gap-2">
               <Label htmlFor="public-mode" className="text-xs">Public</Label>
               <Switch 
                 id="public-mode" 
                 checked={currentResume.isPublic}
                 onCheckedChange={() => togglePublic()}
               />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {currentResume.isPublic 
              ? "Your resume is visible to anyone with the link." 
              : "Your resume is private. Only you can see it."}
          </p>
          
          {currentResume.isPublic && (
            <div className="flex items-center space-x-2">
              <Input value={url} readOnly className="h-8 text-xs" />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}