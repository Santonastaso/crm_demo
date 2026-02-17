import {
  ShowBase,
  useShowContext,
  useGetOne,
  useGetList,
} from "ra-core";
import { ReferenceField, TextField } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ExternalLink,
  MessageSquare,
  Mail,
  Phone,
  User,
  Briefcase,
} from "lucide-react";
import type { Booking, Contact, CommunicationLog, Deal } from "../types";
import { Link } from "react-router";

export const BookingShow = () => (
  <ShowBase>
    <BookingShowContent />
  </ShowBase>
);

const BookingShowContent = () => {
  const { record, isPending } = useShowContext<Booking>();

  if (isPending || !record) return null;

  return (
    <div className="mt-2 max-w-4xl mx-auto space-y-4">
      <BookingHeader booking={record} />
      {record.contact_id && (
        <>
          <ContactRecap contactId={Number(record.contact_id)} />
          <CommunicationHistory contactId={Number(record.contact_id)} />
          <ContactDeals contactId={Number(record.contact_id)} />
        </>
      )}
    </div>
  );
};

const BookingHeader = ({ booking }: { booking: Booking }) => {
  const statusVariant =
    booking.status === "confirmed"
      ? "default"
      : booking.status === "cancelled"
        ? "destructive"
        : "secondary";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Appuntamento #{String(booking.id)}
        </CardTitle>
        <Badge variant={statusVariant}>{booking.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Data:</span>{" "}
            {booking.scheduled_at
              ? new Date(booking.scheduled_at).toLocaleString("it-IT", {
                  dateStyle: "full",
                  timeStyle: "short",
                })
              : "Da confermare"}
          </div>
          <div>
            <span className="text-muted-foreground">Contatto:</span>{" "}
            {booking.contact_id ? (
              <ReferenceField source="contact_id" reference="contacts" link="show" record={booking}>
                <TextField source="first_name" />
              </ReferenceField>
            ) : (
              "N/A"
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Agente:</span>{" "}
            {booking.sales_id ? (
              <ReferenceField source="sales_id" reference="sales" link={false} record={booking}>
                <TextField source="first_name" />
              </ReferenceField>
            ) : (
              "Non assegnato"
            )}
          </div>
          {booking.calcom_event_id && (
            <div>
              <a
                href={`https://app.cal.com/bookings/${booking.calcom_event_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Apri su Cal.com
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ContactRecap = ({ contactId }: { contactId: number }) => {
  const { data: contact } = useGetOne<Contact>("contacts", { id: contactId });

  if (!contact) return null;

  const emails = (contact.email_jsonb ?? []).map((e) => e.email).filter(Boolean);
  const phones = (contact.phone_jsonb ?? []).map((p) => p.number).filter(Boolean);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Profilo Lead
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Nome:</span>{" "}
            <Link to={`/contacts/${contactId}/show`} className="text-primary hover:underline">
              {contact.first_name} {contact.last_name}
            </Link>
          </div>
          {contact.title && (
            <div>
              <span className="text-muted-foreground">Ruolo:</span> {contact.title}
            </div>
          )}
          {contact.lead_type && (
            <div>
              <span className="text-muted-foreground">Tipo lead:</span>{" "}
              <Badge variant="outline" className="text-xs capitalize">
                {contact.lead_type.replace("_", " ")}
              </Badge>
            </div>
          )}
          {contact.source && (
            <div>
              <span className="text-muted-foreground">Provenienza:</span>{" "}
              <Badge variant="outline" className="text-xs">{contact.source}</Badge>
            </div>
          )}
          {emails.length > 0 && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {emails[0]}
            </div>
          )}
          {phones.length > 0 && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {phones[0]}
            </div>
          )}
        </div>
        {contact.background && (
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground">Background:</span>
            <p className="mt-1 text-muted-foreground whitespace-pre-line">{contact.background}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CommunicationHistory = ({ contactId }: { contactId: number }) => {
  const { data: logs = [] } = useGetList<CommunicationLog>("communication_log", {
    pagination: { page: 1, perPage: 20 },
    sort: { field: "created_at", order: "DESC" },
    filter: { contact_id: contactId },
  });

  if (logs.length === 0) return null;

  const channelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-3 w-3" />;
      case "whatsapp":
      case "sms":
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Storico Comunicazioni ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={String(log.id)}
              className="flex items-start gap-2 text-sm border-l-2 border-muted pl-3 py-1"
            >
              <div className="mt-0.5 text-muted-foreground">
                {channelIcon(log.channel)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {log.direction === "inbound" ? "IN" : "OUT"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("it-IT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                {log.content_summary && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {log.content_summary}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ContactDeals = ({ contactId }: { contactId: number }) => {
  const { data: deals = [] } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "updated_at", order: "DESC" },
    filter: { "contact_ids@cs": `{${contactId}}` },
  });

  if (deals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Deal Associati ({deals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deals.map((deal) => (
            <Link
              key={String(deal.id)}
              to={`/deals/${deal.id}/show`}
              className="flex items-center justify-between text-sm py-1.5 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
            >
              <div>
                <span className="font-medium">{deal.name}</span>
                <span className="text-muted-foreground ml-2">{deal.stage}</span>
              </div>
              <span className="text-muted-foreground">
                {deal.amount
                  ? new Intl.NumberFormat("it-IT", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(deal.amount)
                  : ""}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
