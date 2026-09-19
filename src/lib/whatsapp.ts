/**
 * Formats a lead into the required clean WhatsApp text summary:
 * Date: [Date]
 * Name: [Customer Name]
 * Phone: [Phone Number]
 * Service Required: [Selected Services]
 * Requirement: [Detailed Requirements]
 * Location: [Location]
 */
export function formatLeadSummaryText(lead: {
  date: string;
  customerName: string;
  phone: string;
  services: string[];
  requirements: string;
  location: string;
}): string {
  const serviceText = lead.services.length > 0 ? lead.services.join(', ') : 'General';
  const reqText = lead.requirements.trim() || 'Standard assessment required';
  const locText = lead.location.trim() || 'Contact for address';

  return [
    `Date: ${lead.date}`,
    `Name: ${lead.customerName}`,
    `Phone: ${lead.phone}`,
    `Service Required: ${serviceText}`,
    `Requirement: ${reqText}`,
    `Location: ${locText}`,
  ].join('\n');
}

/**
 * Sanitizes phone numbers for WhatsApp wa.me links.
 * Strips parentheses, dashes, spaces, and ensures clean digit string.
 * Example: "+1 (555) 234-5678" -> "15552345678"
 */
export function sanitizeWhatsAppPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned;
}

/**
 * Builds the direct WhatsApp dispatch URL:
 * https://wa.me/[VendorPhone]?text=[URLEncodedMessage]
 */
export function generateWhatsAppLink(vendorPhone: string, messageText: string): string {
  const sanitizedPhone = sanitizeWhatsAppPhone(vendorPhone);
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${sanitizedPhone}?text=${encodedText}`;
}

/**
 * Copies text to the clipboard with modern navigator API
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    // Fallback for non-secure contexts or older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
