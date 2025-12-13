-- Seed role-specific legal documents (customer/helper) (idempotent)

-- CUSTOMER TERMS v1
INSERT INTO legal_documents (type, audience, version, title, content_md, is_active)
SELECT 'terms', 'customer', 1, 'Helparo Customer Terms & Conditions (v1)',
$$# Helparo Customer Terms & Conditions (v1)

**Last updated:** 2025-12-14

These Customer Terms (“**Customer Terms**”) govern your use of Helparo as a customer (“**Customer**”). By creating an account, browsing, booking, requesting, paying for, or receiving services through Helparo, you agree to these Customer Terms.

## 1. About Helparo (Marketplace Notice)

Helparo is a **technology platform / marketplace** that helps customers connect with independent service providers (“**Helpers**”). **Helparo does not provide home services** and does not employ Helpers.

## 2. Eligibility & Account

- You must be at least **18 years old** (or have valid guardian consent as permitted by law).
- You must provide **accurate, complete, and current** information.
- You are responsible for maintaining account security and all activity under your account.

## 3. Bookings, Service Requests & Estimates

- Service descriptions, prices, availability, and time estimates may vary.
- Any “estimated” price or duration is an **estimate only**, not a guarantee.
- The final scope of work is agreed between you and the Helper.

## 4. Payments, Fees, Refunds & Taxes

- Payments may be collected and processed via third‑party payment providers.
- Helparo may charge platform fees, convenience fees, cancellation fees, or other charges as displayed.
- Refunds (if any) are governed by the applicable policy shown at the time of booking and may depend on the Helper’s cancellation/fulfilment status.
- You are responsible for applicable taxes unless stated otherwise.

## 5. Customer Responsibilities (Safety & Cooperation)

You agree to:

- Provide **safe access** to the service location.
- Ensure the work area is reasonably safe and free from hazards.
- Provide accurate information about the job and allow the Helper to inspect before work begins.
- Treat Helpers with dignity; **no harassment, threats, discrimination, or abusive behaviour**.

If you feel unsafe, stop the interaction and contact local authorities.

## 6. Prohibited Use

You must not use Helparo for:

- Any illegal activity, fraud, or misrepresentation.
- Any form of **adult content, escorting, sexual services, pornography**, or “entertainment” services of a sexual nature.
- Violence, weapons, controlled substances, or any activity that violates law or the rights of others.
- Stalking, harassment, doxxing, or misuse of another person’s information.

## 7. Communications & Recordkeeping

You consent to receiving service-related communications (SMS/WhatsApp/push/email) for OTPs, booking updates, support, and safety notifications.

## 8. Ratings, Reviews & Content

- You may submit ratings/reviews that are truthful and lawful.
- Helparo may remove content that violates policies or law.

## 9. Disclaimers

- Helparo is provided on an “**as is**” and “**as available**” basis.
- Helparo does not warrant that Helpers will meet your expectations or that services will be uninterrupted or error‑free.
- Helpers are independent; Helparo does not guarantee their workmanship, timelines, or outcomes.

## 10. Limitation of Liability

To the maximum extent permitted by law:

- Helparo is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages.
- Helparo’s total liability for any claim related to a booking is limited to the fees you paid to Helparo for that booking (if any) in the **30 days** before the event giving rise to the claim.

Some jurisdictions do not allow certain limitations; your rights may vary.

## 11. Indemnity

You agree to defend, indemnify, and hold harmless Helparo, its owners, directors, employees, and agents from claims arising out of your misuse of the platform, your violation of these terms, or disputes with Helpers.

## 12. Disputes (Customer–Helper)

Disputes about service quality, delays, property damage, or pricing are primarily between you and the Helper. Helparo may offer support tools or mediation but is not obligated to resolve disputes.

## 13. Termination

Helparo may suspend or terminate your account if you violate these terms, misuse the platform, or pose a safety risk.

## 14. Changes

We may update these Customer Terms. Continued use after changes means you accept the updated terms.

## 15. Contact

For support or legal requests, contact Helparo through the in‑app support channels.
$$,
true
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents WHERE type='terms' AND audience='customer' AND version=1
);

-- HELPER TERMS v1
INSERT INTO legal_documents (type, audience, version, title, content_md, is_active)
SELECT 'terms', 'helper', 1, 'Helparo Helper Terms & Conditions (v1)',
$$# Helparo Helper Terms & Conditions (v1)

**Last updated:** 2025-12-14

These Helper Terms (“**Helper Terms**”) govern your use of Helparo as a service provider (“**Helper**”). By onboarding, listing services, accepting jobs, or receiving payments through Helparo, you agree to these Helper Terms.

## 1. Independent Contractor Relationship

- You are an **independent contractor**, not an employee, agent, or partner of Helparo.
- You control how you perform services, subject to platform rules and applicable law.
- You are responsible for your taxes, licenses, tools, insurance, and compliance obligations.

## 2. Eligibility, Verification & Background Checks

- You must provide accurate information and valid documents.
- Helparo may perform verification checks and may reject or deactivate accounts that fail checks.
- You consent to reasonable verification and safety processes.

## 3. Service Standards & Conduct

You agree to:

- Perform services safely, professionally, and as described.
- Follow applicable laws, building rules, safety guidelines, and customer instructions (to the extent lawful).
- Not harass, intimidate, discriminate against, or exploit customers.
- Respect customer privacy; do not share customer contact details outside what is needed for the job.

## 4. Prohibited Services & Zero‑Tolerance Policy

Helparo is **not for entertainment** services. You must not offer or request:

- Any **adult entertainment, sexual services, pornography, escorting**, or obscene content.
- Illegal activities, weapons, controlled substances, scams, or fraud.
- Any service that violates law, safety, or platform policy.

Violation may result in immediate suspension/termination and reporting to authorities.

## 5. Jobs, Acceptance, Cancellations & No‑Shows

- Job notifications are invitations; you may accept/decline.
- If you accept a job, you must make best efforts to attend on time.
- Excessive cancellations/no‑shows may reduce visibility, lead to penalties, or deactivation.

## 6. Pricing, Earnings, Platform Fees & Payouts

- Pricing may be set by you, the platform, or shown as recommended rates depending on product settings.
- Helparo may deduct platform fees, payment processing fees, penalties, or taxes as applicable and disclosed.
- Payouts may be subject to verification, fraud review, or compliance checks.

## 7. Safety & Emergency

- If you feel unsafe, **leave immediately** and contact local authorities.
- Use in‑app safety features (SOS) when available.

## 8. Devices, Location & Availability

- Certain features may require device permissions (e.g., location).
- You must not spoof location, manipulate the app, or use automation/bots.

## 9. Disclaimers

- Helparo does not guarantee job volume, income, ratings, or availability of work.
- Helparo may modify platform features and matching algorithms.

## 10. Limitation of Liability

To the maximum extent permitted by law:

- Helparo is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages.
- Helparo’s total liability to you for any claim is limited to the platform fees earned by Helparo from you in the **30 days** before the event giving rise to the claim.

## 11. Indemnity

You agree to indemnify Helparo for claims arising from your services, negligence, misconduct, unlawful behaviour, or violations of these terms.

## 12. Suspension & Termination

Helparo may suspend or terminate your account for safety reasons, policy violations, fraud, repeated cancellations/no‑shows, poor conduct, or legal non‑compliance.

## 13. Changes

We may update these Helper Terms. Continued use after changes means you accept the updated terms.

## 14. Contact

For support, contact Helparo through the in‑app support channels.
$$,
true
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents WHERE type='terms' AND audience='helper' AND version=1
);

-- CUSTOMER PRIVACY v1
INSERT INTO legal_documents (type, audience, version, title, content_md, is_active)
SELECT 'privacy', 'customer', 1, 'Helparo Customer Privacy Policy (v1)',
$$# Helparo Customer Privacy Policy (v1)

**Last updated:** 2025-12-14

This Customer Privacy Policy explains how Helparo collects, uses, shares, and protects personal data when you use Helparo as a customer.

## 1. Data We Collect

- **Account data:** name, email, phone, profile details.
- **Booking data:** address, service requests, messages, photos (if you upload), time preferences.
- **Device/usage data:** device identifiers, log data, app interactions, diagnostics.
- **Location data:** if you grant permission (for address auto‑fill, helper matching, tracking features).
- **Payments:** payment status and limited payment metadata (payment processing is handled by providers; we do not store full card details).

## 2. How We Use Data

- Provide and improve the platform, including matching and service fulfillment.
- Communicate booking updates, OTPs, safety alerts, and support messages.
- Prevent fraud, abuse, and policy violations.
- Comply with legal obligations.

## 3. Sharing of Data

We may share data with:

- **Helpers** for a booking (name, contact, location, job details) as needed to perform services.
- **Service providers** (cloud hosting, analytics, communication, payment processors) under contracts.
- **Authorities** if required by law or to protect safety and rights.

We do not sell your personal data.

## 4. Retention

We retain data as long as necessary for bookings, support, fraud prevention, and legal compliance.

## 5. Security

We use reasonable administrative, technical, and physical safeguards. No system is 100% secure.

## 6. Your Choices

- You can update profile information in the app.
- You can control certain permissions (e.g., location) in device settings.

## 7. Children

Helparo is not intended for children under 18.

## 8. Changes

We may update this policy. Continued use means you accept the updated policy.
$$,
true
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents WHERE type='privacy' AND audience='customer' AND version=1
);

-- HELPER PRIVACY v1
INSERT INTO legal_documents (type, audience, version, title, content_md, is_active)
SELECT 'privacy', 'helper', 1, 'Helparo Helper Privacy Policy (v1)',
$$# Helparo Helper Privacy Policy (v1)

**Last updated:** 2025-12-14

This Helper Privacy Policy explains how Helparo collects, uses, shares, and protects personal data when you use Helparo as a Helper.

## 1. Data We Collect

- **Account data:** name, email, phone, profile details.
- **Verification data:** ID documents, bank details (for payouts), and verification status.
- **Work data:** services offered, availability, job history, ratings/reviews.
- **Location data:** if enabled (for matching, navigation, tracking/safety features).
- **Device/usage data:** device identifiers, logs, diagnostics.

## 2. How We Use Data

- Operate the marketplace (matching, job flow, payouts).
- Verify identity and help prevent fraud and unsafe behaviour.
- Communicate job updates, OTPs, and safety alerts.
- Improve platform performance and user experience.

## 3. Sharing of Data

We may share data with:

- **Customers** for a booking (name, photo, service details, approximate location during the job) as needed to deliver services.
- **Payment/Banking providers** to process payouts.
- **Service providers** (cloud, analytics, communication) under contract.
- **Authorities** where required by law or to protect safety.

We do not sell your personal data.

## 4. Location & Safety

If enabled, location may be used for matching, route support, service-area validation, and safety features. You may disable location in device settings, but some features may not function.

## 5. Retention & Security

We retain data as needed for platform operations, fraud prevention, and legal compliance, and we use reasonable safeguards to protect data.

## 6. Your Choices

You can update profile information in the app and control device permissions.

## 7. Changes

We may update this policy. Continued use means you accept the updated policy.
$$,
true
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents WHERE type='privacy' AND audience='helper' AND version=1
);
