import { describe, test, expect, beforeAll } from "bun:test";
import HCBAccount from "../src/hcb";
import { env } from "bun";

describe("HCBAccount", () => {
  let hcbAccount: HCBAccount;
  
  beforeAll(async () => {
    hcbAccount = new HCBAccount(env.HCB_SESSION_TOKEN!);
    await hcbAccount.pre();
  });

  test("getOrganization", async () => {
    const organization = await hcbAccount.getOrganization("salesian-hackbotics");
    expect(organization).toBeDefined();
    expect(organization?.name).toBe("Salesian Hackbotics");
  });

  test("getTransactions", async () => {
    const transactions = await hcbAccount.getTransactions("salesian-hackbotics");
    expect(transactions).toBeDefined();
    expect(transactions?.length).toBeGreaterThan(0);
    console.log(transactions);
  });

  test("getDonations", async () => {
    const donations = await hcbAccount.getDonations("salesian-hackbotics");
    expect(donations).toBeDefined();
    expect(donations?.length).toBeGreaterThan(0);
    console.log(donations);
  });

  test("getDonationDetails", async () => {
    let donations = await hcbAccount.getDonations("salesian-hackbotics");
    // get the first donation
    const donation = donations?.[0];
    if (!donation) {
      throw new Error("No donations found");
    }
    const donationDetails = await hcbAccount.getDonationDetails(donation.details_url!);
    expect(donationDetails).toBeDefined();
    console.log(donationDetails);
  });
});