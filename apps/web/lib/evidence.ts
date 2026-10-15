const WEBMAIL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
const BRANDS = ["shopify", "rbc", "td", "scotiabank", "amazon", "google", "bell", "air canada", "service canada"];

export type Evidence = {
  webmail_as_hr: boolean;
  brand_mismatch: boolean;
  notes: string[];
};

export function evidenceFor(input: { from_email?: string; company_name?: string }): Evidence | null {
  const email = input.from_email?.trim().toLowerCase() ?? "";
  const company = input.company_name?.trim().toLowerCase() ?? "";
  if (!email || !company) return null;
  const domain = email.split("@")[1] ?? "";
  const webmail = WEBMAIL.some((host) => domain === host);
  const brand = BRANDS.some((name) => company.includes(name));
  if (!webmail || !brand) {
    return { webmail_as_hr: false, brand_mismatch: false, notes: [] };
  }
  return {
    webmail_as_hr: true,
    brand_mismatch: true,
    notes: [`${input.company_name} is named, and the address is on ${domain}.`],
  };
}
