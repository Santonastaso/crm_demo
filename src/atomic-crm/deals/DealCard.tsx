import { ReferenceField } from "@/components/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Draggable } from "@hello-pangea/dnd";
import { useRedirect } from "ra-core";
import { CompanyAvatar } from "../companies/CompanyAvatar";
import { formatEURCompact } from "@/lib/formatPrice";
import { differenceInDays } from "date-fns";
import type { Deal } from "../types";

const DaysInStage = ({ deal }: { deal: Deal }) => {
  const enteredAt = deal.stage_entered_at ?? deal.created_at;
  if (!enteredAt) return null;
  const days = differenceInDays(new Date(), new Date(enteredAt));
  if (days < 3) return null;
  const color =
    days >= 14
      ? "text-red-600"
      : days >= 7
        ? "text-amber-600"
        : "text-muted-foreground";
  return (
    <span className={`text-[10px] font-medium ${color}`}>
      {days}g in stage
    </span>
  );
};

export const DealCard = ({ deal, index }: { deal: Deal; index: number }) => {
  if (!deal) return null;

  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <DealCardContent provided={provided} snapshot={snapshot} deal={deal} />
      )}
    </Draggable>
  );
};

export const DealCardContent = ({
  provided,
  snapshot,
  deal,
}: {
  provided?: any;
  snapshot?: any;
  deal: Deal;
}) => {
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(`/deals/${deal.id}/show`, undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <Card
        className={`py-4 transition-all duration-200 ${
          snapshot?.isDragging
            ? "opacity-90 transform rotate-1 shadow-lg"
            : "shadow-sm hover:shadow-md"
        }`}
      >
        <CardContent className="px-4 flex">
          <ReferenceField
            source="company_id"
            record={deal}
            reference="companies"
            link={false}
          >
            <CompanyAvatar width={20} height={20} />
          </ReferenceField>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium mb-2">{deal.name}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {formatEURCompact(deal.amount)}
                {deal.category ? `, ${deal.category}` : ""}
              </p>
              <DaysInStage deal={deal} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
