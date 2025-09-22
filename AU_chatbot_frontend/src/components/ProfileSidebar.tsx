"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger,
    SheetHeader,
    SheetTitle
} from "@/components/ui/sheet";
import { 
    User, 
    Settings, 
    LogOut, 
    Lock, 
    Trash2, 
    History,
    AlertTriangle 
} from "lucide-react";

interface ProfileSidebarProps {
    userName: string;
    userEmail: string;
    userRole: string;
}

export default function ProfileSidebar({ userName, userEmail, userRole }: ProfileSidebarProps) {
    const [profileOpen, setProfileOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleDeleteHistory = () => {
        if (confirm("Are you sure you want to delete all chat history? This action cannot be undone.")) {
            // Handle delete history logic here
            console.log("Delete history confirmed");
            setProfileOpen(false);
        }
    };

    const handleChangePassword = () => {
        // Handle change password logic here
        console.log("Change password clicked");
        setProfileOpen(false);
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.")) {
            // Handle delete account logic here
            console.log("Delete account confirmed");
            setProfileOpen(false);
        }
    };

    const handleSignOut = () => {
        if (confirm("Are you sure you want to sign out?")) {
            // Handle sign out logic here
            console.log("Sign out confirmed");
            setProfileOpen(false);
        }
    };

    return (
        <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-white hover:bg-[#23272f] px-3 py-2 rounded-lg"
                >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <span className="text-black text-sm font-semibold">
                            {getInitials(userName)}
                        </span>
                    </div>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                        {userName}
                    </span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80">
                <SheetHeader className="sr-only">
                    <SheetTitle>User Profile</SheetTitle>
                </SheetHeader>
                <div className="h-full bg-[#18181b] text-white flex flex-col">
                    {/* Profile Header */}
                    <div className="p-6 border-b border-[#23272f]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
                                <span className="text-black text-2xl font-bold">
                                    {getInitials(userName)}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{userName}</h2>
                            <p className="text-sm text-gray-400 mb-2">{userEmail}</p>
                            <span className="text-xs bg-[#23272f] text-gray-300 px-3 py-1 rounded-full">
                                {userRole}
                            </span>
                        </div>
                    </div>

                    {/* Profile Actions */}
                    <div className="flex-1 p-4">
                        <div className="space-y-2">
                            {/* Account Settings */}
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                    Account
                                </h3>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-white hover:bg-[#23272f] px-3 py-2"
                                    onClick={() => {
                                        console.log("Edit profile clicked");
                                        setProfileOpen(false);
                                    }}
                                >
                                    <User size={16} className="mr-3" />
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-white hover:bg-[#23272f] px-3 py-2"
                                    onClick={handleChangePassword}
                                >
                                    <Lock size={16} className="mr-3" />
                                    Change Password
                                </Button>
                                
                            </div>

                            <Separator className="bg-[#23272f] my-4" />

                            {/* Data Management */}
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                    Data
                                </h3>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-white hover:bg-[#23272f] px-3 py-2"
                                    onClick={handleDeleteHistory}
                                >
                                    <History size={16} className="mr-3" />
                                    Delete Chat History
                                </Button>
                            </div>

                            <Separator className="bg-[#23272f] my-4" />

                            {/* Danger Zone */}
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wider">
                                    Danger Zone
                                </h3>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-400 hover:bg-red-900/20 px-3 py-2"
                                    onClick={handleDeleteAccount}
                                >
                                    <Trash2 size={16} className="mr-3" />
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <div className="p-4 border-t border-[#23272f]">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-white hover:bg-[#23272f] px-3 py-2"
                            onClick={handleSignOut}
                        >
                            <LogOut size={16} className="mr-3" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}