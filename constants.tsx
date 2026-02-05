
import React from 'react';
import { Mail, FileText, Zap, Code, LayoutGrid } from 'lucide-react';
import { CategoryType, MacroItem, BuilderTemplate } from './types';

export const INITIAL_MACROS: MacroItem[] = [
  {
    id: '1751468838942',
    title: 'Selfie with ID',
    category: 'Emails',
    content: "Hello<br>We're just getting in touch to request a few documents as we have to complete security checks to comply with our obligations to player safety and responsibility.<br>Please can you send us:<br>• a photo of yourself holding your ID and a piece of paper with today's date (we accept a passport or driving licence for ID).<br>• a photo of your ID<br>• a proof of address document (e.g. utility bill or letter from a financial institution dated in the last 3 months).<br>• a photo of your card (we need to see the first 6 and last 4 digits of the long number, the name and the expiration date).<br>• a PDF copy of your mobile phone bill (dated in the last 3 months).<br>A valid driving licence is a sure winner and would satisfy our request for proof ID and address in one step.<br>Please see here for some guidance on what documents we can accept, or you can always get in touch if you have any questions.",
    updatedAt: 1751468838942
  },
  {
    id: '1752574690893',
    title: 'Fraud doc - closed',
    category: 'Emails',
    content: "Hello,<br>Following a review of your account and the documentation you provided, we have made the decision to close your account with immediate effect. This closure is final, and there will be no option to reopen the account.<br>In line with our Terms and Conditions, your withdrawal request has been denied, and no further funds will be processed. Please see the relevant clauses below:<br>12.1 We are entitled to close your Account at any time and do not need to give you prior notice. Any balance in your Account at the time of such closure or any closure under Section 12.2 below will be paid back to you, except that:<br>12.1.1 If you have engaged in illegal activity, MrQ is under no obligation to refund to you any money that may be in your Account; and<br>12.1.2 If we discover or have reasonable grounds to believe that you have participated in any of the activities listed in Section 12.4 (each a \"Prohibited Activity\"), then we will withhold all or part of the balance and/or recover from your Account deposits, payouts, bonuses, and/or any winnings attributable to those activities.<br>12.2 We will suspend your Account where we have reason to believe that you have engaged or are likely to engage in any Prohibited Activity. Should our investigation result in our reasonable determination that such activity has occurred, we will restrict or permanently close your Account.<br>12.3 Your funds cannot be accessed or withdrawn during periods of suspension, and any balance will remain in the Account.<br>For full details, you can review our Terms and Conditions at: https://mrq.com/terms-and-conditions",
    updatedAt: 1752574690893
  },
  {
    id: '1752579395624',
    title: 'Account closed at reg - Remain closed',
    category: 'Emails',
    content: "Hello,<br>Thank you for providing your documents.<br>Following a review of your account, a business decision has been made not to proceed with opening your account. In accordance with our Terms and Conditions, we are unable to discuss the specific reason for this decision.<br>As outlined in our Terms:<br>12.1 We are entitled to close your Account at any time and do not need to give you prior notice. Any balance in your Account at the time of such closure or any closure under Section 12.2 below will be paid back to you, except in circumstances laid forth in Sections 12.1.1 to 12.1.3.<br>For more information, you can view our full Terms and Conditions here: https://mrq.com/terms-and-conditions",
    updatedAt: 1752579395624
  },
  {
    id: '1752580311677',
    title: 'No screenshot of virtual card rev',
    category: 'Emails',
    content: "Thank you for your reply.<br>Unfortunately, we’re unable to accept screenshots of your virtual card.<br>To verify your card, we will require one of the following:<br>• A card confirmation page<br>You can access a PDF copy by opening your Revolut app, tapping your profile, then going to Documents > General.<br>• A PDF bank statement showing your MrQ deposits.",
    updatedAt: 1752580311677
  },
  {
    id: '1752581076845',
    title: 'ID pass WD sent',
    category: 'Emails',
    content: "Hello,<br>Thank you for your reply and for providing the requested documents to verify your account.<br>I can confirm that your ID has been successfully verified, and any restrictions on your account have now been removed.<br>Any pending withdrawals have also been processed and should reach you shortly.",
    updatedAt: 1752581076845
  },
  {
    id: '1753184295052',
    title: 'KYC docs - account opened',
    category: 'Emails',
    content: "Hello,<br>Thank you for providing your KYC documents.<br>We sincerely apologise for the delay in getting your account reviewed and activated, and we appreciate your patience during this time.<br>I can confirm that your documents have now been reviewed and successfully processed. Your account is active and fully accessible.<br>If you have any further questions or need assistance, feel free to get in touch.",
    updatedAt: 1753184295052
  },
  {
    id: '1761218585032',
    title: 'Account note ID received',
    category: 'Notes',
    content: "**Received:**<br><br>- ID:<br>- PoA:<br>- PoO:<br><br>**Requested/Outcome**",
    updatedAt: 1761218585032
  },
  {
    id: '1762354120824',
    title: 'FL2 Closue',
    category: 'Emails',
    content: "Hello<br>Following a review of your account, we have identified activity that is inconsistent with fair play and the intended use of promotional rewards at MrQ.<br>As stated in our Fair Use Policy, “Any promotional offer you receive will be subject to this policy … We believe in fair play, hence there are no wagering requirements on any of our offers.” This means that although promotions carry no wagering requirement, they are still issued on the basis of genuine, entertainment-based gameplay and must not be used primarily for extracting promotional value.<br>Under the General Terms & Conditions (specifically the section relating to “abusing player Accounts”), prohibited promotional play includes:<br>• Holding more than one account.<br>• Placing equal, zero or very low-margin bets.<br>• Using the website solely for the purpose of claiming bonuses without intention to deposit or wager with real money.<br>Since our review shows that your account was used in a way that matches these forms of promotional abuse, we have exercised our rights under the Terms & Conditions to take action.<br>As a result, your account has been permanently closed, and all future participation in promotions is void. Any real-money balance remaining has been returned to your verified withdrawal method.<br>Please note that the decision is made in accordance with the above-quoted policy and terms. If you believe this decision has been reached in error, you may request a review by replying to this email and we will reopen the case for reassessment.",
    updatedAt: 1762354120824
  },
  {
    id: '1767801910640',
    title: 'Warning used payment method on 3rd party account',
    category: 'Emails',
    content: "Hey,<br><br>Thanks for getting back to us and for sending over the documents we needed 👍<br>I can confirm that your ID has been successfully verified, and any restrictions on your account have now been removed. Any pending withdrawals have also been processed and should be with you shortly.<br><br>That said, we do need to flag something important.<br><br>While your ID has passed our checks, it’s against our Terms and Conditions for payment methods to be used across multiple MrQ accounts. This means your card should only ever be used on your own account, and not on anyone else’s.<br><br>Here’s the official bit (Section 6.2):<br><br>6.2. You may only hold one account. If we discover that you hold or are operating more than one account and/or the same payment details are used across multiple accounts, these will be classified as “Duplicate Accounts.”<br>6.2.1. If Duplicate Accounts are identified, we reserve the right to close the duplicate account(s), leaving only one active account, unless there are grounds to close all accounts (for example, where multiple accounts have been deliberately or fraudulently opened).<br><br>We get that mistakes happen – we’re only human after all – so please take this as a friendly warning. From here on out, make sure your payment methods are only used on your own MrQ account. If we see your card being used on another account again, we’ll have no choice but to close the account. No drama, just keeping things safe and fair for everyone.<br><br>Cheers for understanding,",
    updatedAt: 1767801910640
  },
  {
    id: '1890001000001',
    title: 'EMAIL - AP low risk warning (docs received)',
    category: 'Emails',
    content: "Hey,<br><br>Thanks for sending over the requested documents 👍<br><br>I can confirm everything’s been reviewed and your account is good to go. Any restrictions have now been removed, and any pending withdrawals have been processed (if applicable).<br><br>Just a quick reminder about payment methods on your account:<br>- all cards, bank accounts or other payment methods must be in your name<br>- you shouldn’t use your payment methods on anyone else’s MrQ account, and you shouldn’t allow third-party payment methods to be used on your account<br><br>To keep things safe and fair, the payment method that was linked across accounts will remain blocked going forward. Please make sure anything you add from now on is yours.<br><br>If we see payment methods being used across accounts again, we may have to take further action, including account closure.<br><br>Cheers for understanding,",
    updatedAt: 1890001000001
  },
  {
    id: '1890001000002',
    title: 'EMAIL - AP low risk warning (no docs / proactive)',
    category: 'Emails',
    content: "Hey,<br><br>We’ve noticed that a payment method linked to your MrQ account has been used across multiple accounts.<br><br>Just a quick reminder: all cards, bank accounts or other payment methods must be in your name. You shouldn’t use your payment methods on anyone else’s MrQ account, and you shouldn’t allow third-party payment methods to be used on your account.<br><br>To keep things safe and fair, the payment method linked across accounts will remain blocked going forward.<br><br>If we see payment methods being used across accounts again, we may have to take further action, including account closure.<br><br>Cheers for understanding,",
    updatedAt: 1890001000002
  },
  {
    id: '1890001000003',
    title: 'EMAIL - AP high risk closure (shared payment method)',
    category: 'Emails',
    content: "Hello,<br><br>Following a review of your account, it has been identified that at least one payment method used on your account has also been used on another MrQ account.<br><br>As a result, and in line with our Terms and Conditions, a decision has been made to close your account. We’re unable to discuss the specific details behind this decision.<br><br>Any remaining balance on your account will be returned to the original payment method, where applicable, in line with our Terms.<br><br>For more information, you can view our full Terms and Conditions here:<br>https://mrq.com/terms-and-conditions<br><br>Kind regards,<br>MrQ Team",
    updatedAt: 1890001000003
  }
];

export const INITIAL_BUILDERS: BuilderTemplate[] = [
  {
    id: 'id-verification',
    name: 'ID Verification',
    primaryLabel: 'Documents',
    secondaryLabel: 'Outcomes',
    items: [
      'Driving licence (ID & PoA)',
      'Passport',
      'IDNTFAD',
      'PoA',
      'PoO',
      'Source of Wealth',
      'IDNTF',
      'ID'
    ],
    outcomes: [
      'SDD & EDD flags set to approved',
      'Withdrawal approved',
      'Restrictions removed'
    ],
    links: [
      {
        id: 'link-default-wd-pass',
        type: 'all_outcomes_selected',
        triggerLabel: '',
        macroId: '1752581076845' // ID pass WD sent
      }
    ]
  },
  {
    id: 'apple-pay-linked',
    name: 'Apple Pay review (linked accounts)',
    primaryLabel: 'Apple Pay',
    secondaryLabel: 'Linked accounts',
    items: [],
    outcomes: [
      'High risk → Close',
      'Medium risk → Restrict + request PoO',
      'Low risk → Keep open + warn'
    ],
    links: [
      {
        id: 'link-apple-highrisk-close-1',
        type: 'outcome_selected',
        triggerLabel: 'High risk → Close',
        macroId: '1890001000003' // Send: AP high risk closure email
      },
      {
        id: 'link-apple-lowrisk-docs-2',
        type: 'outcome_selected',
        triggerLabel: 'Low risk → Keep open + warn',
        macroId: '1890001000001' // Send: Low risk warning (docs received)
      },
      {
        id: 'link-apple-lowrisk-nodocs-2',
        type: 'outcome_selected',
        triggerLabel: 'Low risk → Keep open + warn',
        macroId: '1890001000002' // Send: Low risk warning (no docs)
      }
    ]
  },
  {
    id: 'seon-closed-kyc',
    name: 'SEON closed (KYC review)',
    primaryLabel: 'SEON',
    secondaryLabel: 'KYC review',
    headerNote: '**Account closed by SEON due to high risk score triggered**',
    items: [
      'ID',
      'POA'
    ],
    outcomes: [
      'Re-opened',
      'Remains closed (SEON high risk)',
      'Request more docs'
    ],
    links: [
      {
        id: 'link-seon-reopened',
        type: 'outcome_selected',
        triggerLabel: 'Re-opened',
        macroId: '1753184295052' // TODO: confirm macro for account active email (KYC approved)
      },
      {
        id: 'link-seon-closed',
        type: 'outcome_selected',
        triggerLabel: 'Remains closed (SEON high risk)',
        macroId: '1752579395624' // TODO: confirm macro for business decision / T&Cs closure
      }
    ]
  }
];

export const CATEGORY_ICONS: Record<CategoryType | 'All', React.ReactNode> = {
  'All': <LayoutGrid size={18} />,
  'Emails': <Mail size={18} />,
  'Notes': <FileText size={18} />,
  'Macros': <Zap size={18} />,
  'Snippets': <Code size={18} />
};
