import { z } from "zod";

export const ZodDonation = z.object({
  donor_name: z.string(),
  private_donor: z.boolean(),
  details_url: z.string().url().nullish(),
});

export const ZodHCBOrganization = z.object({
  id: z.string(),
  object: z.string(),
  href: z.string(),
  name: z.string(),
  slug: z.string(),
  website: z.string(),
  category: z.string(),
  transparent: z.boolean(),
  demo_mode: z.boolean(),
  logo: z.string(),
  donation_header: z.string(),
  background_image: z.string(),
  public_message: z.string(),
  donation_link: z.string(),
  balances: z.object({
    balance_cents: z.number(),
    fee_balance_cents: z.number(),
    incoming_balance_cents: z.number(),
    total_raised: z.number(),
  }),
  created_at: z.string(),
  users: z.array(z.object({
    id: z.string(),
    object: z.string(),
    full_name: z.string(),
    admin: z.boolean(),
    photo: z.string(),
  })),
});

export const ZodDonationDetails = z.object({
  donation_time: z.string().optional(),
  donor_email: z.string().email(),
  transaction_memo: z.string(),
  transaction_message: z.string(),
  amount: z.number(),
});

export const ZodTransaction = z.object({
  memo: z.string(),
  amount: z.number(),
  tags: z.array(z.string()),
  transaction_id: z.string().nullish(),
});