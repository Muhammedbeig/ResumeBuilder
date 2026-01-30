"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { User, Settings, LogOut, Lock, User as UserIcon } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export function UserNav() {
  const { data: session, update } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

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
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: newName,
            image: selectedImage 
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      await update({ name: newName, image: selectedImage || user?.image });
      toast.success("Profile updated successfully");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
        const res = await fetch('/api/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                currentPassword,
                newPassword 
            }),
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
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
              </DialogTrigger>
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
          <Tabs defaultValue="general" className="w-full">
            <TabsList className={`grid w-full ${user?.hasPassword ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="general">General</TabsTrigger>
              {user?.hasPassword && <TabsTrigger value="security">Security</TabsTrigger>}
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
              {!user?.hasPassword && (
                <p className="text-[0.8rem] text-amber-600 dark:text-amber-400 font-medium">
                  This account is managed via Google. You can add a password by registering with your email.
                </p>
              )}
              <Button onClick={handleUpdateProfile} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </TabsContent>

            {user?.hasPassword && (
              <TabsContent value="security" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                      id="current-password" 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                      id="new-password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                  />
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
