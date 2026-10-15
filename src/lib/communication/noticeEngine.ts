/**
 * Super Eagles AMMS - Notice & Communication Engine
 * Provides local, zero-cost WhatsApp, Email, and SMS message generation with South African standard formats.
 */

export interface ClubBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType?: string;
  referenceFormat?: string;
  snapScanUrl?: string;
}

export const DEFAULT_CLUB_BANK_DETAILS: ClubBankDetails = {
  bankName: "Standard Bank South Africa",
  accountName: "Super Eagles Athletics Club",
  accountNumber: "023456789",
  branchCode: "051001",
  accountType: "Club Cheque Account",
  referenceFormat: "Club Number + Surname (e.g. SEA001 KHUMALO)",
  snapScanUrl: "https://pos.snapscan.io/qr/supereaglesac",
};

/**
 * Normalizes any South African or international mobile number into international E.164 digits without symbols.
 * e.g. "082 123 4567" -> "27821234567", "+27 (83) 999-0000" -> "27839990000"
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length === 10) {
    return `27${digits.slice(1)}`;
  }
  if (digits.startsWith("27") && digits.length === 11) {
    return digits;
  }
  if (digits.length >= 9 && digits.length <= 15) {
    return digits;
  }
  return null;
}

export interface NoticePayload {
  recipientName: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  athleteNumber?: string | null;
  title: string;
  subject: string;
  body: string;
  whatsappUrl: string | null;
  mailtoUrl: string | null;
}

/**
 * Generates an official membership dues payment reminder notice.
 */
export function generatePaymentReminderNotice(params: {
  athleteName: string;
  athleteNumber: string;
  phone?: string | null;
  email?: string | null;
  amountOwed: number;
  seasonYear: number;
  category: string;
  bankDetails?: ClubBankDetails;
}): NoticePayload {
  const bank = params.bankDetails || DEFAULT_CLUB_BANK_DETAILS;
  const cleanPhone = normalizePhoneNumber(params.phone);
  const ref = `${params.athleteNumber} ${params.athleteName.split(" ").pop()?.toUpperCase() || ""}`.trim();

  const text = 
`🦅 *SUPER EAGLES ATHLETICS CLUB*
*ANNUAL MEMBERSHIP DUES NOTICE (${params.seasonYear})*

Dear ${params.athleteName} (Member #${params.athleteNumber}),

This is a friendly reminder that your club membership dues for the *${params.seasonYear} season* (${(params.category || "Senior").replace(/_/g, " ")}) are currently outstanding.

💰 *Amount Due:* R${params.amountOwed.toFixed(2)}
📋 *Deposit Reference:* ${ref}

🏦 *BANKING DETAILS:*
• Bank: ${bank.bankName}
• Account Name: ${bank.accountName}
• Account Number: ${bank.accountNumber}
• Branch Code: ${bank.branchCode}

📱 *Instant SnapScan:*
${bank.snapScanUrl || "Available at clubhouse desk"}

*Proof of Payment (POP):*
Please upload your POP directly via your mobile member portal or reply to this notice with your bank receipt.

Thank you for your reciprocal commitment to Super Eagles Athletics Club! 🦅🇿🇦`.trim();

  const subject = `Super Eagles AC - Membership Dues Reminder ${params.seasonYear} (#${params.athleteNumber})`;

  return {
    recipientName: params.athleteName,
    recipientPhone: cleanPhone,
    recipientEmail: params.email || null,
    athleteNumber: params.athleteNumber,
    title: "Annual Membership Payment Reminder",
    subject,
    body: text,
    whatsappUrl: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : null,
    mailtoUrl: params.email ? `mailto:${params.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` : null,
  };
}

/**
 * Generates an official payment verification & receipt notice.
 */
export function generatePaymentReceiptNotice(params: {
  athleteName: string;
  athleteNumber: string;
  phone?: string | null;
  email?: string | null;
  amountPaid: number;
  receiptNumber: string;
  seasonYear: number;
  paymentMethod: string;
}): NoticePayload {
  const cleanPhone = normalizePhoneNumber(params.phone);

  const text = 
`🦅 *SUPER EAGLES ATHLETICS CLUB*
*OFFICIAL DUES RECEIPT #${params.receiptNumber}*

Dear ${params.athleteName} (#${params.athleteNumber}),

We have successfully verified and reconciled your payment of *R${params.amountPaid.toFixed(2)}* (${params.paymentMethod}) for the *${params.seasonYear} Season*.

✅ *Status:* FULLY PAID & ACTIVE
📅 *Valid Through:* 31 December ${params.seasonYear}
🧾 *Receipt Number:* ${params.receiptNumber}

Your digital membership card has been updated. All club runs, official race capture, wellness logs, and sponsorship privileges remain active.

Good luck on the road and trails! 🏃‍♂️💨`.trim();

  const subject = `Super Eagles AC - Official Dues Receipt #${params.receiptNumber}`;

  return {
    recipientName: params.athleteName,
    recipientPhone: cleanPhone,
    recipientEmail: params.email || null,
    athleteNumber: params.athleteNumber,
    title: "Official Dues Payment Receipt",
    subject,
    body: text,
    whatsappUrl: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : null,
    mailtoUrl: params.email ? `mailto:${params.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` : null,
  };
}

/**
 * Generates an event registration & logistics notice (Transport, Hotel, Bib).
 */
export function generateRaceLogisticsNotice(params: {
  athleteName: string;
  athleteNumber: string;
  phone?: string | null;
  email?: string | null;
  raceName: string;
  raceDate?: string;
  transportOption?: string;
  busDepartureTime?: string;
  hotelName?: string;
  roomNumber?: string;
  pickupPoint?: string;
  bibNumber?: string;
}): NoticePayload {
  const cleanPhone = normalizePhoneNumber(params.phone);

  const text = 
`🦅 *SUPER EAGLES ATHLETICS CLUB*
*RACE DAY LOGISTICS: ${params.raceName.toUpperCase()}*

Dear ${params.athleteName} (#${params.athleteNumber}),

Here are your confirmed logistics for *${params.raceName}* on *${params.raceDate || "Race Weekend"}*:

${params.bibNumber ? `🎽 *Race Bib Number:* #${params.bibNumber}` : "🎽 *Race Bib:* Collect at club hospitality tent"}
${params.transportOption === "BUS_SEAT" || params.busDepartureTime ? `🚌 *Club Transport:* BUS CONFIRMED
   • Departure Time: ${params.busDepartureTime || "04:30 AM"}
   • Location: ${params.pickupPoint || "Super Eagles Clubhouse"}` : "🚗 *Transport:* Self-Drive / Direct Arrival"}
${params.hotelName ? `🏨 *Accommodation:* ${params.hotelName}${params.roomNumber ? ` (${params.roomNumber})` : ""}` : ""}

Please arrive at least 45 minutes prior to bus departure. Club gazebos and support will be stationed at the finish area!

Run with pride! 🦅🇿🇦`.trim();

  const subject = `Super Eagles AC - Race Logistics: ${params.raceName}`;

  return {
    recipientName: params.athleteName,
    recipientPhone: cleanPhone,
    recipientEmail: params.email || null,
    athleteNumber: params.athleteNumber,
    title: `Logistics Notice - ${params.raceName}`,
    subject,
    body: text,
    whatsappUrl: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : null,
    mailtoUrl: params.email ? `mailto:${params.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` : null,
  };
}

/**
 * Generates an annual rollover & season renewal notice.
 */
export function generateSeasonRenewalNotice(params: {
  athleteName: string;
  athleteNumber: string;
  phone?: string | null;
  email?: string | null;
  newSeasonYear: number;
  category: string;
  renewalFee: number;
  earlyBirdCutoff?: string;
  bankDetails?: ClubBankDetails;
}): NoticePayload {
  const bank = params.bankDetails || DEFAULT_CLUB_BANK_DETAILS;
  const cleanPhone = normalizePhoneNumber(params.phone);
  const ref = `REN${params.athleteNumber} ${params.newSeasonYear}`;

  const text = 
`🦅 *SUPER EAGLES ATHLETICS CLUB*
*ANNUAL SEASON ROLLOVER & RENEWAL (${params.newSeasonYear})*

Dear ${params.athleteName} (#${params.athleteNumber}),

The *${params.newSeasonYear} Athletics & Walking Season* is now officially open! Renew your membership to keep your ASA License active and secure your club sponsorship standing.

🏃 Category: ${params.category.replace(/_/g, " ")}
💰 Annual Renewal Fee: R${params.renewalFee.toFixed(2)}
${params.earlyBirdCutoff ? `⏳ Early Bird Deadline: ${params.earlyBirdCutoff}` : ""}
📋 Deposit Reference: ${ref}

🏦 *Bank Account:*
${bank.bankName} | Acc: ${bank.accountNumber} | Branch: ${bank.branchCode}

Upload your proof of payment on your member portal to instantly renew your credentials!

Here's to another soaring season with the Eagles! 🦅✨`.trim();

  const subject = `Super Eagles AC - ${params.newSeasonYear} Membership Season Renewal (#${params.athleteNumber})`;

  return {
    recipientName: params.athleteName,
    recipientPhone: cleanPhone,
    recipientEmail: params.email || null,
    athleteNumber: params.athleteNumber,
    title: `Season Renewal - ${params.newSeasonYear}`,
    subject,
    body: text,
    whatsappUrl: cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : null,
    mailtoUrl: params.email ? `mailto:${params.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}` : null,
  };
}

export const generateRenewalNotice = generateSeasonRenewalNotice;
export type DispatchNotice = NoticePayload;

