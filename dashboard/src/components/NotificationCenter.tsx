import { useState } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Info, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  X,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, Notification, NotificationType } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'success': return <div className="p-1.5 rounded-full bg-green-500/10"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>;
    case 'warning': return <div className="p-1.5 rounded-full bg-yellow-500/10"><AlertTriangle className="h-4 w-4 text-yellow-500" /></div>;
    case 'error': return <div className="p-1.5 rounded-full bg-red-500/10"><AlertCircle className="h-4 w-4 text-red-500" /></div>;
    default: return <div className="p-1.5 rounded-full bg-blue-500/10"><Info className="h-4 w-4 text-blue-500" /></div>;
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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-full w-9 h-9">
          <Bell className="h-4 w-4 text-muted-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 shadow-xl border-border/60" align="end" sideOffset={8}>
        <div className="flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
               {unreadCount > 0 && (
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Mark all as read"
                      onClick={markAllAsRead}
                      className="h-7 w-7 rounded-full hover:bg-background/80"
                  >
                      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </Button>
               )}
               {notifications.length > 0 && (
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Clear all"
                      onClick={clearAll}
                      className="h-7 w-7 rounded-full hover:bg-background/80"
                  >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
               )}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1 overflow-y-auto">
             {notifications.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 px-6">
                     <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                         <Inbox className="h-5 w-5 text-muted-foreground/40" />
                     </div>
                     <div className="space-y-1">
                         <p className="text-sm font-medium text-foreground">No notifications</p>
                         <p className="text-xs text-muted-foreground/80">You're all caught up!</p>
                     </div>
                 </div>
             ) : (
                 <div className="flex flex-col divide-y divide-border/30">
                     {notifications.map((notification) => (
                         <div 
                             key={notification.id}
                             className={cn(
                                 "relative group flex gap-3 p-4 transition-colors hover:bg-muted/30 cursor-pointer",
                                 !notification.read && "bg-muted/10"
                             )}
                             onClick={() => !notification.read && markAsRead(notification.id)}
                         >
                             <div className="mt-0.5 shrink-0">
                                 <NotificationIcon type={notification.type} />
                             </div>
                             <div className="flex-1 min-w-0 space-y-1">
                                 <div className="flex items-start justify-between gap-2">
                                     <p className={cn("text-xs font-semibold leading-none truncate", notification.read && "text-muted-foreground")}>
                                         {notification.title}
                                     </p>
                                     <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                         {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                     </span>
                                 </div>
                                 <p className={cn("text-xs leading-relaxed line-clamp-2", notification.read ? "text-muted-foreground/70" : "text-foreground/90")}>
                                     {notification.message}
                                 </p>
                             </div>
                             
                             <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeNotification(notification.id);
                                    }}
                                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}                                          size="sm" 
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
