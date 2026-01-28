import { MessageCircle, Bell, Truck, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openWhatsAppChat, WhatsAppMessageType } from "@/lib/whatsapp";

interface JobDetails {
  title: string;
  pickupLocation?: string;
  dropLocation?: string;
  scheduledPickup?: string;
  budgetCents?: number;
  driverName?: string;
  shipperName?: string;
}

interface WhatsAppActionsProps {
  phone: string;
  jobDetails: JobDetails;
  availableActions?: WhatsAppMessageType[];
}

const ACTION_CONFIG: Record<
  WhatsAppMessageType,
  { label: string; icon: typeof MessageCircle; description: string }
> = {
  job_posted: {
    label: "Job Notification",
    icon: Bell,
    description: "Notify about new job",
  },
  bid_received: {
    label: "Bid Received",
    icon: MessageCircle,
    description: "Alert about new bid",
  },
  bid_accepted: {
    label: "Bid Accepted",
    icon: CheckCircle,
    description: "Confirm bid acceptance",
  },
  pickup_reminder: {
    label: "Pickup Reminder",
    icon: Bell,
    description: "Send pickup reminder",
  },
  in_transit: {
    label: "In Transit Update",
    icon: Truck,
    description: "Notify shipment status",
  },
  delivery_confirmation: {
    label: "Delivery Confirmed",
    icon: CheckCircle,
    description: "Confirm delivery",
  },
  support: {
    label: "Support Request",
    icon: HelpCircle,
    description: "Open support chat",
  },
};

export function WhatsAppActions({
  phone,
  jobDetails,
  availableActions = ["pickup_reminder", "in_transit", "delivery_confirmation", "support"],
}: WhatsAppActionsProps) {
  if (!phone) return null;

  const handleAction = (type: WhatsAppMessageType) => {
    openWhatsAppChat(phone, type, jobDetails);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-success border-success/30 hover:bg-success/10"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Send WhatsApp Message</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableActions.map((actionType) => {
          const config = ACTION_CONFIG[actionType];
          const Icon = config.icon;
          return (
            <DropdownMenuItem
              key={actionType}
              onClick={() => handleAction(actionType)}
              className="cursor-pointer"
            >
              <Icon className="h-4 w-4 mr-2 text-success" />
              <div className="flex flex-col">
                <span>{config.label}</span>
                <span className="text-xs text-muted-foreground">{config.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
