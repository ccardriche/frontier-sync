/**
 * WhatsApp Click-to-Chat Integration
 * Generates wa.me links with pre-filled messages for logistics operations
 */

export type WhatsAppMessageType = 
  | "job_posted"
  | "bid_received"
  | "bid_accepted"
  | "pickup_reminder"
  | "in_transit"
  | "delivery_confirmation"
  | "support";

interface JobDetails {
  title: string;
  pickupLocation?: string;
  dropLocation?: string;
  scheduledPickup?: string;
  budgetCents?: number;
  driverName?: string;
  shipperName?: string;
}

/**
 * Sanitizes phone number to international format (removes spaces, dashes, etc.)
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except leading +
  let sanitized = phone.replace(/[^\d+]/g, "");
  
  // If starts with 0, assume local number - this would need country code handling
  // For now, just strip the leading 0
  if (sanitized.startsWith("0")) {
    sanitized = sanitized.substring(1);
  }
  
  // Remove leading + for wa.me format
  if (sanitized.startsWith("+")) {
    sanitized = sanitized.substring(1);
  }
  
  return sanitized;
}

/**
 * Generates pre-filled message based on message type and job details
 */
export function generateWhatsAppMessage(type: WhatsAppMessageType, details: JobDetails): string {
  const messages: Record<WhatsAppMessageType, string> = {
    job_posted: `🚚 *New Job Posted*\n\n📦 ${details.title}\n📍 From: ${details.pickupLocation || "TBD"}\n📍 To: ${details.dropLocation || "TBD"}${details.budgetCents ? `\n💰 Budget: $${(details.budgetCents / 100).toFixed(2)}` : ""}\n\nInterested in this job? Reply to discuss details.`,

    bid_received: `📬 *New Bid Received*\n\n📦 Job: ${details.title}\n👤 Driver: ${details.driverName || "A driver"}\n\nLogin to Pioneer Nexus to review the bid and accept or negotiate.`,

    bid_accepted: `✅ *Bid Accepted!*\n\n📦 Job: ${details.title}\n📍 Pickup: ${details.pickupLocation || "TBD"}${details.scheduledPickup ? `\n🕐 Scheduled: ${details.scheduledPickup}` : ""}\n\nPlease confirm you're ready for pickup.`,

    pickup_reminder: `⏰ *Pickup Reminder*\n\n📦 Job: ${details.title}\n📍 Location: ${details.pickupLocation || "Check app for details"}${details.scheduledPickup ? `\n🕐 Time: ${details.scheduledPickup}` : ""}\n\nPlease confirm when you've arrived at the pickup location.`,

    in_transit: `🚛 *Shipment In Transit*\n\n📦 ${details.title}\n👤 Driver: ${details.driverName || "Your assigned driver"}\n📍 Destination: ${details.dropLocation || "Check app"}\n\nTrack your shipment in the Pioneer Nexus app.`,

    delivery_confirmation: `✅ *Delivery Confirmed*\n\n📦 ${details.title}\n📍 Delivered to: ${details.dropLocation || "destination"}\n\nThank you for using Pioneer Nexus! Rate your experience in the app.`,

    support: `🆘 *Support Request*\n\n📦 Job: ${details.title}\n\nDescribe your issue and our team will assist you shortly.`,
  };

  return messages[type];
}

/**
 * Generates a WhatsApp click-to-chat URL
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const sanitizedPhone = sanitizePhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
}

/**
 * Opens WhatsApp chat in a new tab
 */
export function openWhatsAppChat(phone: string, type: WhatsAppMessageType, details: JobDetails): void {
  const message = generateWhatsAppMessage(type, details);
  const url = generateWhatsAppLink(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Convenience function to get a WhatsApp link for a specific notification type
 */
export function getWhatsAppNotificationLink(
  phone: string,
  type: WhatsAppMessageType,
  details: JobDetails
): string {
  const message = generateWhatsAppMessage(type, details);
  return generateWhatsAppLink(phone, message);
}
