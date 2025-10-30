'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Menu, User, Building, Plus, LogOut, Boxes, Github } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppToast } from "@/hooks/use-app-toast"

const GITHUB_URL = "https://github.com/kavi-lyzr/hr-candidate-sourcing";
const APP_SLUG = "hr-candidate-sourcing";

export function HeaderWithSection() {
  const pathname = usePathname();
  const { isAuthenticated, login, logout, email, userId } = useAuth();
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState<string>("");
  const [requestMessage, setRequestMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast: appToast } = useAppToast();

  const getSectionName = (path: string) => {
    return path.split("/").pop() || "Home";
  };

  useEffect(() => {
    if (email) setRequestEmail(email);
  }, [email]);

  const submitFeatureRequest = async () => {
    if (!requestEmail || !requestMessage) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: requestEmail,
          message: requestMessage,
          app: APP_SLUG,
          pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
          userId: userId || undefined,
        }),
      });
      if (res.ok) {
        setIsRequestOpen(false);
        setRequestMessage("");
        appToast({
          title: "Feature request submitted",
          description: "Thank you for your feedback! We will review it and get back to you soon.",
        });
      } else {
        appToast({
          title: "Failed to submit feature request",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (e) {
      appToast({
        title: "Failed to submit feature request",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionName = getSectionName(pathname);

  return (
    <div className="flex h-14 items-center gap-2 sm:gap-3 border-b px-2 sm:px-4 sticky top-0 z-10 bg-background">
      <SidebarTrigger />
      <div className="h-4 w-px bg-gray-300 hidden sm:block" />
      <h1 className="text-xs sm:text-sm font-medium text-foreground truncate flex-1 sm:flex-none capitalize">
        {sectionName}
      </h1>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Request Feature */}
        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Request Feature
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request a feature</DialogTitle>
              <DialogDescription>
                Share what you'd like to see improved, or schedule a <a href="https://www.lyzr.ai/book-demo/" target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80">call</a>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Your request</label>
                <Textarea
                  placeholder="Describe the feature or feedback..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="min-h-28"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsRequestOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={submitFeatureRequest} disabled={isSubmitting || !requestEmail || !requestMessage}>
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* GitHub Repo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          asChild
          disabled={!GITHUB_URL}
          title="Open GitHub"
        >
          <a href={GITHUB_URL || '#'} target="_blank" rel="noreferrer">
            {/* <Github className="h-4 w-4" /> */}
            <img src="/github.svg" alt="GitHub" className="h-4 w-4 dark:invert" />
          </a>
        </Button>
        <NotificationBell />
        <ThemeSwitcher />
        {isAuthenticated ? (
          <Button variant="outline" size="sm" onClick={logout} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Out</span>
          </Button>
        ) : (
          <Button size="sm" onClick={login} className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Login</span>
            <span className="sm:hidden">In</span>
          </Button>
        )}
      </div>
    </div>
  );
}