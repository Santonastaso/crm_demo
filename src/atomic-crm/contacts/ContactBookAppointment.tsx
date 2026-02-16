import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, X, Loader2, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { useNotify, useRefresh, useGetIdentity } from "ra-core";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Contact } from "../types";

interface Slot {
  date: string;
  time: string;
}

interface ContactBookAppointmentProps {
  contact: Contact;
}

export const ContactBookAppointment = ({
  contact,
}: ContactBookAppointmentProps) => {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "book-videocall",
        {
          method: "POST",
          body: { action: "slots" },
        },
      );
      if (error) throw error;
      setSlots(data?.slots ?? []);
      if (!data?.slots?.length) {
        notify("No available slots found in the next 7 days", {
          type: "warning",
        });
      }
    } catch {
      notify("Failed to fetch available slots", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const handleOpen = () => {
    setOpen(true);
    fetchSlots();
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);

    const emails = contact.email_jsonb ?? [];
    const primaryEmail = emails[0]?.email ?? "";
    const contactName =
      `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();

    try {
      const { data, error } = await supabase.functions.invoke(
        "book-videocall",
        {
          method: "POST",
          body: {
            action: "book",
            date: selectedSlot.date,
            preferred_time: selectedSlot.time,
            contact_id: contact.id,
            sales_id: identity?.id,
            name: contactName || "Contact",
            email: primaryEmail || "noreply@crm.local",
          },
        },
      );
      if (error) throw error;
      notify(
        `Appointment booked for ${selectedSlot.date} at ${selectedSlot.time}`,
      );
      setOpen(false);
      setSelectedSlot(null);
      setSlots([]);
      refresh();
    } catch {
      notify("Failed to book appointment", { type: "error" });
    } finally {
      setBooking(false);
    }
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        className="gap-1"
      >
        <Calendar className="h-4 w-4" />
        Book Appointment
      </Button>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Book Appointment for {contact.first_name}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading available slots...
          </div>
        )}

        {!loading && slots.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No slots available. Try again later.
          </p>
        )}

        {!loading && Object.keys(slotsByDate).length > 0 && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div key={date}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {new Date(date + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="flex flex-wrap gap-1">
                  {dateSlots.map((slot) => {
                    const isSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.time === slot.time;
                    return (
                      <Badge
                        key={`${slot.date}-${slot.time}`}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.time.includes("T")
                          ? new Date(slot.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : slot.time}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-sm">
              Selected:{" "}
              <span className="font-medium">
                {new Date(selectedSlot.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} at{" "}
                {selectedSlot.time.includes("T")
                  ? new Date(selectedSlot.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : selectedSlot.time}
              </span>
            </p>
            <Button
              size="sm"
              onClick={handleBook}
              disabled={booking}
            >
              {booking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Confirm Booking
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
