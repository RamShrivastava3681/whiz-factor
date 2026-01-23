import { Bell, Search, ChevronDown, Shield, User, Settings, LogOut, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ProfileDialog } from '@/components/ProfileDialog';
import { useState, useEffect } from 'react';

export function TopBar() {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
  };

  // Get initials from user name or email
  const getInitials = (name: string, email: string) => {
    if (name && name !== email) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const initials = user ? getInitials(user.name, user.email) : 'U';
  const displayName = user?.name && user.name !== user?.email ? user.name : user?.email?.split('@')[0] || 'User';

  return (
    <>
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left Side - Search */}
      <div className="flex items-center gap-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions, entities, documents..."
            className="pl-10 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all"
          />
        </div>
        
        {/* System Status */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span>All systems operational</span>
        </div>
      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center gap-4">
        {/* Security Level */}
        <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          2FA Active
        </Badge>

        {/* Time Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <div className="text-right">
            <div className="font-mono">{formatTime(currentTime)}</div>
            <div className="text-[10px] leading-none">{formatDate(currentTime)}</div>
          </div>
        </div>

        {/* Role Badge */}
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 capitalize">
          {user?.role || 'User'}
        </Badge>

        {/* Notifications */}
        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 h-10">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">{initials}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'User'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">{initials}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="w-4 h-4 mr-2" />
              Security Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    
    <ProfileDialog
      open={isProfileDialogOpen}
      onOpenChange={setIsProfileDialogOpen}
    />
    </>
  );
}
