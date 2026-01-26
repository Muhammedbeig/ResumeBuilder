"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Plus, FileText, BarChart3, Settings, LogOut, Sparkles, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useResume } from "@/contexts/ResumeContext";

export function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const { resumes } = useResume();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateResume = async () => {
    setIsCreating(true);
    router.push("/resume/new");
    setIsCreating(false);
  };

  const stats = {
    totalResumes: resumes.length,
    totalViews: 1234,
    totalDownloads: 89,
    atsScore: 92
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your resumes and track your job search progress.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Resumes
              </CardTitle>
              <FileText className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalResumes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Resume Views
              </CardTitle>
              <Eye className="w-4 h-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Downloads
              </CardTitle>
              <Download className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalDownloads}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg. ATS Score
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.atsScore}%
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Resumes List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Resumes
              </h2>
              <Button 
                onClick={handleCreateResume}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Resume
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
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Link href={`/resume/${resume.id}`}>
                          <Button size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Features
                </CardTitle>
                <CardDescription>
                  Get the most out of our AI tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Rewrite with AI
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Generate Summary
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Tailor to Job
                </Button>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {user?.subscription === "free" && (
              <Card className="bg-gradient-to-br from-purple-600 to-cyan-500 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Upgrade to Pro</CardTitle>
                  <CardDescription className="text-white/80">
                    Unlock unlimited resumes, all templates, and advanced AI features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                    Upgrade Now - $9/month
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
