"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Plus,
  Trash2,
  Crown,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Slider } from "@/components/ui/slider";
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
  } = useResume();

  const [activeSection, setActiveSection] = useState("basics");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState([90]);

  useEffect(() => {
    if (resumeId) {
      loadResume(resumeId);
    }
  }, [resumeId, loadResume]);

  const templates = resumeTemplates;

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
        // Guest save
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

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    const hasPremium =
      user?.subscription === "pro" || user?.subscription === "business";
    const isLocked = template?.premium && !hasPremium;
    if (isLocked) {
      toast.error("Upgrade to Pro to unlock this template");
      return;
    }
    updateTemplate(templateId);
  };

  const sidebarItems = [
    { id: 'basics', label: 'Basics', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Languages },
    { id: 'projects', label: 'Projects', icon: Code },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'structure', label: 'Rearrange', icon: Layout },
  ];

  return (
    <div className="min-h-screen flex pt-24">
      {/* Sidebar */}
      <div
        className={`bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          isSidebarOpen ? "w-64 p-4" : "w-0 p-0 border-r-0"
        }`}
      >
        {isSidebarOpen && (
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between pl-6 pr-16 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resume Editor
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportImage}
              disabled={isExporting}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Export Image
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <ResizablePanelGroup className="flex-1 overflow-hidden">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={50} minSize={35}>
            <div className="h-full p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeSection === 'basics' && (
                <motion.div
                  key="basics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <Input 
                        value={resumeData.basics.name}
                        onChange={(e) => updateBasics({ name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Professional Title
                      </label>
                      <Input 
                        value={resumeData.basics.title}
                        onChange={(e) => updateBasics({ title: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <Input 
                        type="email"
                        value={resumeData.basics.email}
                        onChange={(e) => updateBasics({ email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <Input 
                        value={resumeData.basics.phone}
                        onChange={(e) => updateBasics({ phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <Input 
                      value={resumeData.basics.location}
                      onChange={(e) => updateBasics({ location: e.target.value })}
                      placeholder="San Francisco, CA"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        LinkedIn
                      </label>
                      <Input 
                        value={resumeData.basics.linkedin || ''}
                        onChange={(e) => updateBasics({ linkedin: e.target.value })}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GitHub
                      </label>
                      <Input 
                        value={resumeData.basics.github || ''}
                        onChange={(e) => updateBasics({ github: e.target.value })}
                        placeholder="github.com/johndoe"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Professional Summary
                      </label>
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
                </motion.div>
              )}

              {activeSection === 'experience' && (
                <ExperienceSection />
              )}

              {activeSection === 'education' && (
                <EducationSection />
              )}

              {activeSection === 'skills' && (
                <SkillsSection />
              )}

              {activeSection === 'projects' && (
                <ProjectsSection />
              )}

              {activeSection === 'certifications' && (
                <CertificationsSection />
              )}

              {activeSection === 'structure' && (
                  <motion.div
                    key="structure"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                      <SectionManager />
                  </motion.div>
              )}
            </AnimatePresence>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview Panel */}
          <ResizablePanel defaultSize={50} minSize={35}>
            <div className="h-full bg-gray-50 dark:bg-gray-900/50 p-6 overflow-y-auto">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Live Preview
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{zoom[0]}%</span>
                    <Slider
                      value={zoom}
                      onValueChange={setZoom}
                      min={50}
                      max={150}
                      step={5}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto bg-gray-100/50 dark:bg-gray-900/50 p-8 flex justify-center items-start">
                <div 
                  style={{  
                    transform: `scale(${zoom[0] / 100})`, 
                    transformOrigin: "top center",
                    marginBottom: '2rem'
                  }}
                >
                  <div
                    id="resume-preview"
                    className="bg-white text-black shadow-2xl mx-auto"
                    style={{
                      width: '918px',
                      minHeight: '1188px',
                    }}
                  >
                    <ActiveTemplate 
                      key={JSON.stringify(resumeData.structure)} 
                      data={resumeData} 
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

// Experience Section Component
function ExperienceSection() {
  const {
    resumeData,
    addExperience,
    updateExperience,
    removeExperience,
    rewriteBulletAI,
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
              <Input
                placeholder="Company Name"
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
              />
              <Input
                placeholder="Job Title"
                value={newExperience.role}
                onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
              />
            </div>
            <Input
              placeholder="Location"
              value={newExperience.location}
              onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Start Date (e.g., Jan 2020)"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
              />
              <Input
                placeholder="End Date (e.g., Dec 2022)"
                value={newExperience.endDate}
                onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                disabled={newExperience.current}
              />
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

// Education Section Component
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
            <Input
              placeholder="Institution Name"
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Degree (e.g., Bachelor's)"
                value={newEducation.degree}
                onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
              />
              <Input
                placeholder="Field of Study"
                value={newEducation.field}
                onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                placeholder="Start Year"
                value={newEducation.startDate}
                onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
              />
              <Input
                placeholder="End Year"
                value={newEducation.endDate}
                onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
              />
              <Input
                placeholder="GPA (optional)"
                value={newEducation.gpa}
                onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
              />
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

// Skills Section Component
function SkillsSection() {
  const { resumeData, addSkillGroup, updateSkillGroup, removeSkillGroup } = useResume();
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

// Projects Section Component
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

// Certifications Section Component
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
              <Input
                placeholder="Date Earned"
                value={newCert.date}
                onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
              />
              <Input
                placeholder="Certificate Link (optional)"
                value={newCert.link}
                onChange={(e) => setNewCert({ ...newCert, link: e.target.value })}
              />
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
