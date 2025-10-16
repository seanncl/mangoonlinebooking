import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Staff } from '@/types/booking';
import { Clock } from 'lucide-react';

interface StaffScheduleModalProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffScheduleModal({ staff, open, onOpenChange }: StaffScheduleModalProps) {
  const isMobile = useIsMobile();

  if (!staff) return null;

  const scheduleContent = (
    <div className="py-4">
      <div className="flex items-center gap-4 mb-6">
        {staff.photo_url ? (
          <img
            src={staff.photo_url}
            alt={`${staff.first_name} ${staff.last_name}`}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="text-5xl">{staff.avatar_emoji}</div>
        )}
        <div>
          <h3 className="font-semibold text-lg">
            {staff.first_name} {staff.last_name}
          </h3>
          {staff.bio && (
            <p className="text-sm text-muted-foreground">{staff.bio}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <h4 className="font-medium">Working Hours</h4>
        </div>
        
        <div className="space-y-3 pl-7">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Monday - Friday</span>
            <span className="text-sm text-muted-foreground">9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Saturday</span>
            <span className="text-sm text-muted-foreground">10:00 AM - 6:00 PM</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm font-medium">Sunday</span>
            <span className="text-sm text-muted-foreground">11:00 AM - 5:00 PM</span>
          </div>
        </div>

        {staff.next_available_time && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Next Available: </span>
              <span className="text-muted-foreground">
                {new Date(staff.next_available_time).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Schedule</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {scheduleContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule</DialogTitle>
        </DialogHeader>
        {scheduleContent}
      </DialogContent>
    </Dialog>
  );
}
