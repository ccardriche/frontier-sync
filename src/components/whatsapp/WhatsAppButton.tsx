import { MessageCircle } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { openWhatsAppChat, WhatsAppMessageType } from "@/lib/whatsapp";

interface WhatsAppButtonProps extends Omit<ButtonProps, "onClick"> {
  phone: string;
  messageType: WhatsAppMessageType;
  jobDetails: {
    title: string;
    pickupLocation?: string;
    dropLocation?: string;
    scheduledPickup?: string;
    budgetCents?: number;
    driverName?: string;
    shipperName?: string;
  };
  tooltipText?: string;
}

export function WhatsAppButton({
  phone,
  messageType,
  jobDetails,
  tooltipText = "Send WhatsApp message",
  variant = "outline",
  size = "sm",
  children,
  ...props
}: WhatsAppButtonProps) {
  const handleClick = () => {
    if (!phone) return;
    openWhatsAppChat(phone, messageType, jobDetails);
  };

  if (!phone) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className="gap-2 text-success border-success/30 hover:bg-success/10 hover:text-success"
          {...props}
        >
          <MessageCircle className="h-4 w-4" />
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}
