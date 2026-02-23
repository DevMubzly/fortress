import { useState } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Info, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, Notification, NotificationType } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
    default: return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    removeNotification 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Use Dialog for modal behavior or Sheet for side drawer. 
  // User asked for "modal". I'll use a Dialog centered one as requested.
  // Actually, standard modern notification centers are usually Popovers or Drawers.
  // But strictly interpreting "modal" means centered dialog. 
  // However, "modal to view notifications" often colloquially means "popover/overlay".
  // I will use Sheet (Side Modal) because it handles lists better than a centered dialog.
  // Unless user specifically said "centered modal". They said "modal". A sheet is a modal drawer.

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
        <div className="p-6 pb-2 border-b border-border/50">
          <SheetHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 rounded-full px-2 text-xs">
                    {unreadCount} New
                  </Badge>
                )}
              </SheetTitle>
              <div className="flex items-center gap-1">
                 {unreadCount > 0 && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Mark all as read"
                        onClick={markAllAsRead}
                        className="h-8 w-8"
                    >
                        <CheckCheck className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                 )}
                 {notifications.length > 0 && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Clear all"
                        onClick={clearAll}
                        className="h-8 w-8"
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                 )}
              </div>
            </div>
            <SheetDescription>
              Stay updated with system alerts, license verify events, and model downloads.
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 p-6 pt-2">
           {notifications.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-40 text-center space-y-4 mt-10">
                   <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                       <Bell className="h-6 w-6 text-muted-foreground/50" />
                   </div>
                   <div className="space-y-1">
                       <p className="text-sm font-medium">No notifications</p>
                       <p className="text-xs text-muted-foreground">You're all caught up!</p>
                   </div>
               </div>
           ) : (
               <div className="space-y-4">
                   {notifications.map((notification) => (
                       <div 
                           key={notification.id}
                           className={cn(
                               "relative group flex gap-4 p-4 rounded-lg border transition-all hover:bg-muted/40",
                               notification.read ? "bg-background/50 border-border/40" : "bg-card border-border shadow-sm"
                           )}
                       >
                           <div className="mt-1">
                               <NotificationIcon type={notification.type} />
                           </div>
                           <div className="flex-1 space-y-1">
                               <div className="flex items-start justify-between gap-2">
                                   <p className={cn("text-sm font-medium leading-none", notification.read && "text-muted-foreground")}>
                                       {notification.title}
                                   </p>
                                   <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                       {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                   </span>
                               </div>
                               <p className={cn("text-xs text-muted-foreground leading-relaxed", notification.read && "text-muted-foreground/70")}>
                                   {notification.message}
                               </p>
                               
                               {!notification.read && (
                                   <div className="pt-2 flex justify-end">
                                      <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 text-[10px] hover:bg-primary/10 hover:text-primary"
                                          onClick={() => markAsRead(notification.id)}
                                      >
                                          Mark as read
                                      </Button>
                                   </div>
                               )}
                           </div>
                           
                           {/* Delete button (hover only) */}
                           <Button
                               variant="ghost"
                               size="icon"
                               className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                               onClick={(e) => {
                                   e.stopPropagation();
                                   removeNotification(notification.id);
                               }}
                           >
                               <X className="h-3 w-3 text-muted-foreground" />
                           </Button>
                       </div>
                   ))}
               </div>
           )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
