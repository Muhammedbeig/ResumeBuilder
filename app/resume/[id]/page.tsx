import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ResumeEditorPage } from "@/components/pages/ResumeEditor";

export default async function ResumeEditor() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return <ResumeEditorPage />;
}
