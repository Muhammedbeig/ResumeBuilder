"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crown } from "lucide-react";
import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import { useCoverLetter } from "@/contexts/CoverLetterContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

// Placeholder data for preview
const previewData = {
  personalInfo: {
    fullName: "Alex Morgan",
    email: "alex.morgan@example.com",
    phone: "(555) 123-4567",
    address: "123 Innovation Dr",
    city: "San Francisco",
    zipCode: "94103",
  },
  recipientInfo: {
    managerName: "Sarah Connor",
    companyName: "TechCorp Inc.",
    address: "456 Future Way",
    city: "San Francisco",
    zipCode: "94105",
    email: "hiring@techcorp.com",
  },
  content: {
    subject: "Application for Senior Developer Position",
    greeting: "Dear Ms. Connor,",
    opening: "I am writing to express my strong interest in the Senior Developer position at TechCorp Inc.",
    body: "With over 5 years of experience in full-stack development, I have a proven track record of delivering scalable web applications...",
    closing: "Sincerely,",
    signature: "Alex Morgan",
  },
};

export default function NewCoverLetterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { createCoverLetter, importedData } = useCoverLetter();
  const [title, setTitle] = useState("Untitled Cover Letter");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (importedData?.personalInfo?.fullName) {
      setTitle(`${importedData.personalInfo.fullName}'s Cover Letter`);
    }
  }, [importedData]);

  const hasPremium = useMemo(
    () => session?.user?.subscription === "pro" || session?.user?.subscription === "business",
    [session?.user?.subscription]
  );

  const handleSelectTemplate = async (templateId: string, premium: boolean) => {
    if (premium && !hasPremium) {
      toast.error("Upgrade to Pro to unlock this template");
      return;
    }
    setIsCreating(true);
    try {
      const coverLetter = await createCoverLetter(
        title.trim() || "Untitled Cover Letter",
        templateId,
        importedData || previewData 
      );
      toast.success("Cover Letter created successfully!");
      // Redirect to editor (not implemented yet, but we'll point to it)
      router.push(`/cover-letter/${coverLetter.id}`);
    } catch (error) {
      toast.error("Failed to create cover letter");
    } finally {
      setIsCreating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose a Cover Letter Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pick a template to start writing. Premium templates are marked with Pro.
          </p>
        </div>

        <div className="mb-8 max-w-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cover Letter Title
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled Cover Letter"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {coverLetterTemplates.map((template) => {
            const Preview = template.component;
            const isLocked = template.premium && !hasPremium;
            return (
              <Card key={template.id} className="overflow-hidden border-gray-200 dark:border-gray-800">
                <div className="relative bg-gray-50 dark:bg-gray-900/50 p-4">
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    {template.premium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                        <Crown className="h-3 w-3" />
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="h-72 overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="origin-top-left scale-[0.4] w-[250%]">
                      <Preview data={previewData} />
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <Button
                    className="w-full"
                    disabled={isCreating || isLocked}
                    onClick={() => handleSelectTemplate(template.id, template.premium)}
                  >
                    {isCreating ? "Creating..." : "Use this template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
