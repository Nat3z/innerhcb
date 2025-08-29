import { JSDOM } from 'jsdom';
export function scrapeHCBDonation(html: string) {

  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Extract donation details
  const donationTimeElement = document.querySelector('time[datetime]');
  const donationTime = donationTimeElement ? donationTimeElement.getAttribute('datetime') : null;

  const donorEmailElement = document.querySelector('section.details a[href^="mailto:"]');
  if (!donorEmailElement || !donorEmailElement.textContent) {
    return;
  }
  const donorEmail = donorEmailElement.textContent.trim();

  // Find Amount section
  const amountElements = document.querySelectorAll('section.details p');
  let donationAmountCents = 0;
  let transactionMessage = null;

  for (const element of amountElements) {
    const strongElement = element.querySelector('strong');
    if (!strongElement) continue;
    
    const label = strongElement.textContent?.trim();
    
    if (label === 'Amount') {
      const amountText = element.textContent?.replace('Amount', '').trim();
      if (amountText) {
        // Convert "+$1.08" to cents (108)
        const match = amountText.match(/[\+\-]?\$?(\d+)\.(\d{2})/);
        if (match) {
          const dollars = parseInt(match[1]);
          const cents = parseInt(match[2]);
          donationAmountCents = dollars * 100 + cents;
          // Handle negative amounts
          if (amountText.startsWith('-')) {
            donationAmountCents = -donationAmountCents;
          }
        }
      }
    } else if (label === 'Message') {
      transactionMessage = element.textContent?.replace('Message', '').trim() || null;
    }
  }

  // Format the data into JSON
  return {
    donation_time: donationTime,
    donor_email: donorEmail,
    transaction_memo: null, // Not present in donation details page
    transaction_message: transactionMessage,
    amount: donationAmountCents
  };

}

export function getAuthenticityToken(html: string) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const tokenElement = document.querySelector('meta[name="csrf-token"]');
  if (!tokenElement) {
    return;
  }
  return tokenElement.getAttribute('content');
}

export function scrapeHCBDonationPage(html: string) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Step 3: Extract donation information
  const donations: any[] = [];
  const rows = document.querySelector('article.table-container')!!.querySelectorAll('tr');

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 5) {
      return;
    }

    const donorNameElement = cells[2];
    if (!donorNameElement || !donorNameElement.textContent) {
      return;
    }
    const donorName = donorNameElement.textContent.trim();

    const privateDonorElement = row.querySelector('div.tooltipped');
    const privateDonor = privateDonorElement ? privateDonorElement.getAttribute('aria-label') === 'Anonymous donor' : false;

    const detailsUrlElement = cells[4].querySelector('a');
    const detailsUrl = detailsUrlElement ? detailsUrlElement.getAttribute('href') : null;

    if (donorName) {
      const donation = {
        donor_name: donorName,
        private_donor: privateDonor,
        details_url: detailsUrl
      };
      donations.push(donation);
    }
  });

  return donations;
}

export function scrapeHCBTransactionsPage(html: string) {
  // Step 3: Extract transaction information
  const dom = new JSDOM(html);
  console.log(html);
  const transactions: any[] = [];
  const transactionRows = dom.window.document.querySelectorAll('tbody[data-behavior=transactions] tr');

  transactionRows.forEach(row => {
    let memoElement = row.querySelector('td.transaction__memo span[data-memo-for]') as HTMLElement;
    if (!memoElement || !memoElement.textContent) {
      memoElement = row.querySelector('td.transaction__memo') as HTMLElement;
    }
    let memo = memoElement ? memoElement.textContent : null;
    if (memo) {
      memo = memo.replace(/\s+/g, ' ').replace("Pending", "").trim();
    }


    const amountElement = row.querySelector('td.nowrap') as HTMLElement;
    const amountText = amountElement ? amountElement.textContent!!.trim() : null;
    let amount = 0;
    if (amountText) {
      amount = parseInt(amountText.replace(/[^\d-]+/g, ''));
    }
    const tagsElements = row.querySelectorAll('td.transaction__memo div.tags .badge') as NodeListOf<HTMLElement>;
    const tags = Array.from(tagsElements).map(tag => tag.textContent!!.trim());

    const transaction_idElement = row.querySelector('td.transaction__memo turbo-frame') as HTMLElement;
    let transaction_id = '';
    if (transaction_idElement) {
      transaction_id = transaction_idElement.id.split(':memo_frame')[0];
    }

    const transaction = {
      memo: memo,
      amount: amount,
      tags: tags,
      transaction_id: transaction_id
    };

    transactions.push(transaction);
  });
  return transactions;
}

export function checkAuthorizationScrape(htmlContent: string) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  const titleElement = document.querySelector('title');
  if (!titleElement) {
    return false;
  }
  titleElement.textContent = titleElement.textContent!!.replace(/\s+/g, ' ').trim();
  return titleElement.textContent.includes('Settings – HCB');
}
