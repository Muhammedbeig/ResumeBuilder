"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Settings, LogOut, CreditCard, Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPasswordPolicyError, normalizeName } from "@/lib/auth-validation";
import { toast } from "sonner";

type SubscriptionLevel = "free" | "pro" | "business";
type SubscriptionPlanId = "weekly" | "monthly" | "annual" | null;
type SettingsTab = "general" | "security" | "plan";

function normalizeSubscription(value?: string | null): SubscriptionLevel {
  if (value === "pro" || value === "business") return value;
  return "free";
}

function normalizeSubscriptionPlanId(value?: string | null): SubscriptionPlanId {
  if (value === "weekly" || value === "monthly" || value === "annual") return value;
  return null;
}

function getPlanMeta(subscription: SubscriptionLevel, planId: SubscriptionPlanId) {
  if (subscription === "free") {
    return {
      badge: "FREE",
      title: "Freemium",
      subtitle: "You are currently using the free plan.",
      isFree: true,
    };
  }

  if (subscription === "business" || planId === "annual") {
    return {
      badge: "ANNUAL",
      title: "Annual Pro",
      subtitle: "Your yearly premium plan is active.",
      isFree: false,
    };
  }

  if (planId === "weekly") {
    return {
      badge: "WEEKLY",
      title: "Job Hunt Pass (Weekly)",
      subtitle: "Your weekly premium plan is active.",
      isFree: false,
    };
  }

  return {
    badge: "PRO",
    title: "Pro Monthly",
    subtitle: "Your monthly premium plan is active.",
    isFree: false,
  };
}

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [newName, setNewName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionLevel>(
    normalizeSubscription(session?.user?.subscription)
  );
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<SubscriptionPlanId>(
    normalizeSubscriptionPlanId(session?.user?.subscriptionPlanId)
  );

  const user = session?.user;
  const isGoogleSession = user?.authProvider === "google";
  const canChangePassword = Boolean(user?.hasPassword || isGoogleSession);
  const planMeta = useMemo(
    () => getPlanMeta(subscription, subscriptionPlanId),
    [subscription, subscriptionPlanId]
  );
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  useEffect(() => {
    setNewName(session?.user?.name || "");
  }, [session?.user?.name]);

  useEffect(() => {
    setSubscription(normalizeSubscription(session?.user?.subscription));
    setSubscriptionPlanId(normalizeSubscriptionPlanId(session?.user?.subscriptionPlanId));
  }, [session?.user?.subscription, session?.user?.subscriptionPlanId]);

  useEffect(() => {
    if (!session?.user?.id) return;

    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/user/subscription", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;

        const nextSubscription = normalizeSubscription(data?.subscription);
        const nextPlanId = normalizeSubscriptionPlanId(data?.subscriptionPlanId);
        setSubscription(nextSubscription);
        setSubscriptionPlanId(nextPlanId);

        const currentSubscription = normalizeSubscription(session?.user?.subscription);
        const currentPlanId = normalizeSubscriptionPlanId(session?.user?.subscriptionPlanId);
        if (nextSubscription !== currentSubscription || nextPlanId !== currentPlanId) {
          await update({
            subscription: nextSubscription,
            subscriptionPlanId: nextPlanId,
          });
        }
      } catch {
        // Keep session values when background sync is unavailable.
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname, session?.user?.id, update]);

  const openPricing = () => {
    const returnPath = pathname || "/dashboard";
    router.push(`/pricing?returnUrl=${encodeURIComponent(returnPath)}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB limit
          toast.error("Image size must be less than 2MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    const normalizedName = normalizeName(newName);
    if (!normalizedName || normalizedName.length < 2 || normalizedName.length > 80) {
      toast.error("Please enter your full name (2-80 characters).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: normalizedName,
            image: selectedImage 
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      await update({ name: normalizedName, image: selectedImage || user?.image });
      toast.success("Profile updated successfully");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    const passwordError = getPasswordPolicyError(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
        const payload: { currentPassword?: string; newPassword: string } = {
          newPassword,
        };
        if (!isGoogleSession && currentPassword.trim() !== "") {
          payload.currentPassword = currentPassword;
        }

        const res = await fetch('/api/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    
        const data = await res.json();
    
        if (!res.ok) throw new Error(data.error || "Failed to update password");

        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 rounded-full px-1.5">
              <span
                className={`mr-2 inline-flex min-w-[58px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  planMeta.isFree
                    ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                }`}
              >
                {planMeta.badge}
              </span>
              <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-800">
                <AvatarImage src={selectedImage || user?.image || ""} alt={user?.name || ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsTab("general");
                    setIsSettingsOpen(true);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsTab("plan");
                    setIsSettingsOpen(true);
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Plan</span>
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {planMeta.badge}
                  </span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/api/stripe/portal?returnUrl=${encodeURIComponent(
                    window.location.pathname
                  )}`;
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing & Subscriptions</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  router.push("/billing/receipts");
                }}
              >
                <Receipt className="mr-2 h-4 w-4" />
                <span>Receipts</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings and preferences.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={settingsTab}
            onValueChange={(value) => setSettingsTab(value as SettingsTab)}
            className="w-full"
          >
            <TabsList className={`grid w-full ${canChangePassword ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="plan">Plan</TabsTrigger>
              {canChangePassword && <TabsTrigger value="security">Security</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-4 mb-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-gray-100">
                        <AvatarImage src={selectedImage || user?.image || ""} />
                        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-center">
                    <Label htmlFor="picture" className="cursor-pointer text-sm text-blue-600 hover:text-blue-500">
                        Change Picture
                        <Input 
                            id="picture" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                        />
                    </Label>
                    {selectedImage && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 text-red-500 h-auto p-0" 
                            onClick={() => setSelectedImage(null)}
                        >
                            Cancel
                        </Button>
                    )}
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-gray-100 dark:bg-gray-800" />
                <p className="text-[0.8rem] text-muted-foreground">Email cannot be changed.</p>
              </div>
              {isGoogleSession && (
                <p className="text-[0.8rem] text-amber-600 dark:text-amber-400 font-medium">
                  You signed in with Google. You can set a password here without entering an old password.
                </p>
              )}
              <Button onClick={handleUpdateProfile} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </TabsContent>

            <TabsContent value="plan" className="space-y-4 py-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Current Plan</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{planMeta.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{planMeta.subtitle}</p>
              </div>

              {planMeta.isFree ? (
                <Button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    openPricing();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
                >
                  Upgrade to Pro
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      window.location.href = `/api/stripe/portal?returnUrl=${encodeURIComponent(
                        pathname || "/dashboard"
                      )}`;
                    }}
                    className="w-full"
                  >
                    Billing & Subscriptions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      openPricing();
                    }}
                    className="w-full"
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </TabsContent>

            {canChangePassword && (
              <TabsContent value="security" className="space-y-4 py-4">
                {!isGoogleSession && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                        id="current-password" 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                      id="new-password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Use 8-72 chars with uppercase, lowercase, number, and special character.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                      id="confirm-password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdatePassword} disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
