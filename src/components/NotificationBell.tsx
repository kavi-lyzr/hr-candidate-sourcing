'use client';

import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { IconBell, IconLoader2 } from '@tabler/icons-react';
import { INotificationDocument } from '@/models/notification';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/AuthProvider';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<INotificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (!open && notifications.some(n => !n.read)) {
      // When closing, mark all as read
      try {
        await fetch('/api/notifications/mark-read', { method: 'PUT' });
        // Refresh notifications to show them as read
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notifications as read', error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">You have {notifications.length} new messages.</p>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="grid gap-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-10">No new notifications.</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id.toString()}
                    className={`text-sm p-2 rounded-md ${!notification.read ? 'bg-secondary' : ''}`}>
                    <p className="font-semibold">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
