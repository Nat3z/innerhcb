import axios, { type AxiosResponse } from "axios";
import { ZodDonation, ZodDonationDetails, ZodHCBOrganization, ZodTransaction } from "./zobjects";
import { getAuthenticityToken, scrapeHCBDonation, scrapeHCBDonationPage, scrapeHCBTransactionsPage } from "./scraper";

export default class HCBAccount {
  private cookieHeader: string;
  private hasPre: boolean = false;
  constructor(public readonly sessionToken: string) {
    this.cookieHeader = "session_token=" + this.sessionToken + ";";
  }

  private async request(url: string): Promise<AxiosResponse | undefined> {
    if (!this.hasPre) {
      throw new Error("You must call pre() before making any requests. HCB provides a bunch of cookies that are required for requests to work, so you must call pre() first.");
    }
    const options = {
      method: 'GET',
      url: url,
      headers: {
        cookie: this.cookieHeader,
        'User-Agent': 'InnerHCB/1.0.0'
      }
    };

    try {
      const response = await axios.request(options);
      return response;
    } catch (error) {
      return undefined;
    }
  }

  async pre() {
    this.hasPre = true;
    try {
      const response = await this.request("https://hcb.hackclub.com/");
      if (!response) {
        return;
      }
      // now with the header cookies, parse them and store them
      const cookies = response.headers['set-cookie'];
      if (!cookies) {
        return;
      }
      for (let cookie of cookies) {
        this.cookieHeader += cookie.split(';')[0] + ";";
      }
    } catch (error) {
      throw new Error("Failed to perform pre() task. HCB will not work without this.");
    }
  }

  async getTransactions(id: string) {
    const response = await this.request("https://hcb.hackclub.com/" + id + "");
    if (!response) {
      
      return;
    }

    try {
      const transactionsUnparsed = scrapeHCBTransactionsPage(response.data);
      let transactionsParsed = ZodTransaction.array().parse(transactionsUnparsed);
      return transactionsParsed;
    } catch (error) {
      
      console.error(error);
    }
  }

  async getDonations(id: string) {
    const response = await this.request("https://hcb.hackclub.com/" + id + "/donations");
    if (!response) {
      console.error("Failed to get donations for " + id); 
      return;
    }

    try {
      const donationsUnparsed = scrapeHCBDonationPage(response.data); 
      let donationsParsed = ZodDonation.array().parse(donationsUnparsed);
      return donationsParsed;
    } catch (error) {
      console.error(error); 
    }
  }

  async getDonationDetails(url: string) {
    const response = await this.request(url);
    if (!response) {
      console.error("Failed to get donation details for " + url);
      return;
    }

    try {
      const donationUnparsed = await scrapeHCBDonation(response.data);
      if (!donationUnparsed) {
        console.error("Failed to get donation details for " + url); 
        return;
      }
      const donation = ZodDonationDetails.parse(donationUnparsed);
      return donation;
    } catch (error) {
      console.error(error);
    }
  }

  async createTag(organizationId: string, transactionId: string, name: string, color?: 'muted' | 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple') {
    const forAuthenticityToken = await this.request("https://hcb.hackclub.com/" + organizationId);
    if (!forAuthenticityToken) {
      console.error("Failed to get authenticity token");
      return;
    }

    const authenticityToken = getAuthenticityToken(forAuthenticityToken.data);
    if (!authenticityToken) {
      console.error("Failed to get authenticity token");
      return;
    }
    const formData = new URLSearchParams();
    formData.append('authenticity_token', authenticityToken);
    formData.append('hcb_code_id', transactionId);
    formData.append('label', name);
    if (color)
      formData.append('color', color);
    formData.append('commit', 'Create');
    try {
      const response = await axios({
        url: "https://hcb.hackclub.com/" + organizationId + "/tags",
        method: 'POST',
        headers: {
          cookie: this.cookieHeader,
          'User-Agent': 'InnerHCB/1.0.0',
          'Content-Type': 'multipart/form-data;',
          'X-CSRF-Token': authenticityToken
        },
        data: formData.toString()
      }) 
      if (response.status === 200) {
        
        return true
      }
      else {
        
      }
    } catch (error) {
      console.error(error);
    }

    return false;
    
  }

  async editTransactionMemo(organizationId: string, transactionId: string, memo: string) {
    const forAuthenticityToken = await this.request("https://hcb.hackclub.com/" + organizationId);
    if (!forAuthenticityToken) {
      console.error("Failed to get authenticity token");
      return;
    }

    const authenticityToken = getAuthenticityToken(forAuthenticityToken.data);
    if (!authenticityToken) {
      console.error("Failed to get authenticity token");
      return;
    }
    const formData = new URLSearchParams();
    formData.append('authenticity_token', authenticityToken);
    formData.append('_method', 'patch');
    formData.append('hcb_code[memo]', memo);
    formData.append('commit', 'Update');
    try {
      const response = await axios({
        url: "https://hcb.hackclub.com/" + "/hcb/" + transactionId,
        method: 'POST',
        headers: {
          cookie: this.cookieHeader,
          'User-Agent': 'InnerHCB/1.0.0',
          'Content-Type': 'multipart/form-data;',
          'X-CSRF-Token': authenticityToken
        },
        data: formData.toString()
      });
      if (response.status === 200) {
        return true
      }
      else {
        
      }
    } catch (error) {
      console.error(error);
    }

    return false;
  }
  generateDonateLink(organizationId: string, amountInCents: number, message: string, monthly: boolean, forGoods: boolean) {
    let url = "https://hcb.hackclub.com/donations/start/" + organizationId + "?";
    url += "amount=" + amountInCents;
    url += "&message=" + encodeURIComponent(message);
    if (monthly)
      url += "&monthly=" + monthly;
    url += "&goods=" + forGoods;
    return url;
  }

  /**
   * Get organization details via the public transparency api.
   * The organization ID provided must have their transparency settings set to public. 
   * @param id The organization ID
   */
  async getOrganization(id: string) {
    const response = await this.request("https://hcb.hackclub.com/api/v3/organizations/" + id);
    if (!response) {
      return;
    }
    const organization = ZodHCBOrganization.parse(response.data);
    return organization;
  }
}
