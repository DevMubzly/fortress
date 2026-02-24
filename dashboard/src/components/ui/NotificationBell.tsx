import React from 'react';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NotificationBell = () => {
    // Mock notifications for now
    const notifications = [
        { id: 1, title: "Model Download Complete", description: "Llama 3.2 1B has finished downloading.", time: "2m ago" },
        { id: 2, title: "System Update", description: "Fortress has been updated to v1.2.", time: "1h ago" },
    ];
    
    const unreadCount = notifications.length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9 border-muted-foreground/20">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground animate-pulse">
                           {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    notifications.map((n) => (
                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                            <div className="flex w-full justify-between items-center">
                                <span className="font-semibold text-xs">{n.title}</span>
                                <span className="text-[10px] text-muted-foreground">{n.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {n.description}
                            </p>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;
