"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, FileText, Eye, File, FileCode, CheckSquare, LayoutTemplate, MoreVertical, Trash, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useResume } from "@/contexts/ResumeContext";

export function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { resumes, deleteResume } = useResume();
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateResume = async () => {
    setIsCreating(true);
    router.push("/resume/new");
    setIsCreating(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteResume(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  const SidebarItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href} className="w-full">
      <Button variant="ghost" className="w-full justify-start gap-2 h-10 px-4 font-normal">
        <Icon className="w-4 h-4 text-gray-500" />
        {label}
      </Button>
    </Link>
  );

  const SidebarGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <SidebarGroup title="Resume">
                <SidebarItem href="/resume/start" icon={FileText} label="Resume Builder" />
                <SidebarItem href="/resume/start" icon={File} label="Import Resume" />
                <SidebarItem href="/templates" icon={LayoutTemplate} label="Templates" />
              </SidebarGroup>

              <SidebarGroup title="CV">
                <SidebarItem href="/cv/start" icon={FileCode} label="CV Builder" />
                <SidebarItem href="/cv/start" icon={File} label="Import CV" />
                <SidebarItem href="/cv/new" icon={LayoutTemplate} label="Templates" />
              </SidebarGroup>

              <SidebarGroup title="Cover Letter">
                <SidebarItem href="/cover-letter/start" icon={FileText} label="Cover Letter Builder" />
                <SidebarItem href="/cover-letter/start" icon={File} label="Import Document" />
                <SidebarItem href="/cover-letter/templates" icon={LayoutTemplate} label="Templates" />
              </SidebarGroup>

              <SidebarGroup title="Tools">
                <SidebarItem href="/ats-checker" icon={CheckSquare} label="ATS Checker" />
                <SidebarItem href="/ai-resume-optimizer" icon={Sparkles} label="AI Resume Optimizer" />
              </SidebarGroup>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.name || "User"}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your resumes and track your job search progress.
              </p>
            </motion.div>

            {/* Resumes List */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Resumes
                </h2>
                <Button 
                  onClick={handleCreateResume}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {resumes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You haven't created any resumes yet.
                    </p>
                    <Button 
                      onClick={handleCreateResume}
                      disabled={isCreating}
                      className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Resume
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {resumes.map((resume) => (
                    <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {resume.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Template: {resume.template} - Updated {resume.updatedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/resume/${resume.id}`}>
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => setDeleteId(resume.id)}
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
