-- CUSTOMER PRIVACY v2 (Customer-facing)
-- Updates the active customer privacy policy shown in the app (LegalModal reads latest active by version).

BEGIN;

-- Deactivate older customer privacy docs
UPDATE public.legal_documents
SET is_active = false
WHERE type = 'privacy'
  AND audience = 'customer'
  AND is_active = true
  AND version < 2;

-- Insert/Upsert the new customer privacy policy
INSERT INTO public.legal_documents (type, audience, version, title, content_md, is_active)
VALUES (
  'privacy',
  'customer',
  2,
  'Helparo Customer Privacy Policy (v2)',
  $$# Helparo Customer Privacy Policy (v2)

**Last updated:** 2025-12-19

This Customer Privacy Policy ("**Policy**") explains how **Helparo** ("**Helparo**", "**we**", "**us**", "**our**") collects, uses, shares, stores, and protects **Personal Data** when you access or use Helparo as a **Customer**.

By accessing or using the Platform, you acknowledge that you have read and understood this Policy and you consent to the collection, use, sharing, and processing of your Personal Data as described herein.

---

## 1. Definitions

1.1 **"Platform"** means Helparo’s website and mobile web experience operated under the domain(s) controlled by Helparo (and any successor URLs), including any customer support channels and related features made available from time to time. For clarity, the Platform includes access through a web browser on mobile devices (mobile web). Any future native application (APK) and its services will also be governed by this Policy unless a separate policy is published.

1.2 **"Customer"**, **"you"** means a user who uses the Platform to request, book, receive, or manage home services.

1.3 **"Helper"** means an independent service provider who offers services through the Platform.

1.4 **"Personal Data"** shall have the meaning assigned under the Digital Personal Data Protection Act, 2023 ("**DPDP Act**").

1.5 **"Sensitive Personal Data or Information"** shall have the meaning assigned under the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 ("**IT Rules 2011**").

1.6 **"Processing"** includes collection, storage, use, disclosure, sharing, transmission, organization, and deletion of Personal Data.

---

## 2. Applicability and Legal Framework

2.1 This Policy is intended to comply with applicable Indian laws including:

- Information Technology Act, 2000 ("**IT Act**");
- IT Rules 2011;
- Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 ("**IT Rules 2021**"); and
- Digital Personal Data Protection Act, 2023 ("**DPDP Act**").

2.2 Where permitted by law, this Policy is drafted to be **platform-protective**. To the extent of any conflict between this Policy and applicable law, applicable law shall prevail.

---

## 3. Personal Data We Collect

We collect Personal Data that you provide, that is generated through your use of the Platform, and that we receive from third parties.

### 3.1 Data you provide directly
**(a) Account and contact data:** phone number, email address, name, and profile information you submit.

**(b) Booking and service request data:** service category, requirements, notes, address details, preferred time slots, and communications relating to bookings.

**(c) Content you upload or share (if enabled/available):** messages, photos, or other files you choose to provide for service fulfillment, support, or dispute resolution.

**(d) Support and grievance data:** complaints, support tickets, call recordings (if applicable and permitted), and related correspondence.

### 3.2 Data collected automatically
**(a) Device and usage data:** device identifiers, device model, operating system, browser type, app/site interactions, diagnostic events, referral/landing pages, and performance logs.

**(b) Network and log data:** IP address, approximate location inferred from IP, timestamps, crash logs, server logs, and security/audit logs.

**(c) Cookies and similar technologies:** see Section 14.

### 3.3 Location data (only where enabled)
**(a) Live location:** real-time location when you permit location access to enable address autofill, service matching, ETA/arrival features, and/or tracking.

**(b) Background location (if enabled by you and supported by your device):** location data collected when the Platform is not in active use, solely to support features that require it (e.g., tracking/dispatch/safety features). You can disable background location in your device settings.

### 3.4 Payment-related data (no card storage)
We may receive and process **payment-related metadata** such as transaction status, payment method type, payment reference IDs, timestamps, refunds/chargeback signals, and limited billing information. **We do not store full card numbers, CVV, or complete payment instrument credentials** on our systems; payment processing is handled by regulated payment service providers.

### 3.5 KYC/identity data (for Helpers, if applicable)
If you choose to register or apply as a Helper (or otherwise interact with helper onboarding flows), Helparo may collect KYC/identity and verification data such as government-issued ID details, selfies, address proof, background verification outcomes, and bank/UPI details **to the extent required for onboarding, compliance, trust and safety, fraud prevention, and payouts**.

---

## 4. Purpose Limitation: Why We Collect and Use Personal Data

We process Personal Data only for legitimate and stated purposes, including:

4.1 **Account creation and authentication** (including OTP-based verification, fraud prevention, and account security).

4.2 **Service discovery, booking, and fulfillment**, including allocating requests, notifying Helpers, facilitating communications, and enabling job completion.

4.3 **Location-enabled features** such as address confirmation, matching, arrival/ETA, and (where enabled) tracking and safety-related features.

4.4 **Payments and billing operations**, including reconciliation, refunds, dispute handling, and compliance.

4.5 **Customer support and grievance redressal**, including handling complaints, safety incidents, charge disputes, and policy enforcement.

4.6 **Trust, safety, and integrity**, including preventing fraud, abuse, spam, unauthorized access, and misuse of the Platform.

4.7 **Legal compliance**, responding to lawful requests, and enforcing our rights and agreements.

4.8 **Analytics and service improvement**, including product performance measurement, bug fixing, and feature optimization, using aggregated or de-identified data where reasonable.

4.9 **Communications**, including transactional messages (booking updates, OTPs, receipts, safety alerts) and administrative communications.

---

## 5. Consent, Lawful Processing, and User Choice

5.1 **Consent**: Where required, we collect and process Personal Data based on your free, specific, informed, and unambiguous consent.

5.2 **Withdrawal of consent**: You may withdraw consent for optional processing at any time through settings (where available) or by contacting us (see Section 18). Withdrawal may limit or prevent certain Platform features from functioning.

5.3 **Legitimate use / contractual necessity**: We may process Personal Data to provide the services you request, to perform our obligations, and for legally permitted legitimate uses.

5.4 **Refusal/denial**: If you decline to provide required Personal Data, we may be unable to create your account, accept a booking request, or provide certain services.

---

## 6. Location Data Disclaimers (Accuracy, Availability, and Control)

6.1 Location data depends on GPS, device sensors, network connectivity, and third-party services. **Accuracy and availability are not guaranteed**.

6.2 We do not warrant that location-based features will be continuous, timely, or error-free, including due to device permissions, battery optimization, OS restrictions, or network issues.

6.3 You may disable location permissions through your device settings. Disabling location may reduce feature availability (e.g., address autofill, matching, ETA, tracking).

---

## 7. How We Share Personal Data

We share Personal Data on a need-to-know basis and only as required to operate the Platform.

7.1 **With Helpers**: We share the minimum necessary booking details to enable service fulfillment (e.g., address, contact, service request details, and communications). You acknowledge that Helpers are independent third parties; their use of data may be governed by their own obligations and applicable law.

7.2 **With service providers (processors)**: We share data with vendors that help us operate, such as:

- **Payment processors** and payment gateways (for payment processing and reconciliation);
- **SMS/OTP and communication providers** (for OTPs, notifications, and transactional messages);
- **Maps/geocoding providers** (for address, routing, and location features);
- **Analytics, monitoring, and crash reporting providers** (to improve reliability and security);
- **Cloud hosting, storage, and infrastructure providers** (to host and secure the Platform).

7.3 **With affiliates and group entities** (if any): We may share Personal Data with our affiliates for operations, compliance, and internal administration, subject to appropriate protections.

7.4 **Business transfers**: In case of merger, acquisition, reorganization, asset sale, or financing, Personal Data may be transferred as part of such transaction subject to confidentiality and lawful processing.

7.5 **Legal and regulatory disclosures**: We may disclose Personal Data to government, law enforcement, judicial, or regulatory authorities when required under applicable law or to respond to valid legal process (see Section 15).

7.6 **Aggregated/de-identified data**: We may share aggregated or de-identified data for analytics, benchmarking, and business insights.

---

## 8. Data Retention and Deletion

8.1 We retain Personal Data only for as long as necessary for the purposes described in this Policy, including to:

- maintain your account and provide services;
- comply with legal, regulatory, accounting, and tax obligations;
- resolve disputes, enforce agreements, and establish or defend legal claims; and
- maintain security, prevent fraud, and protect the integrity of the Platform.

8.2 Retention periods may vary by data type. Certain logs, payment metadata, and communications may be retained longer where required for compliance, auditability, fraud prevention, or dispute resolution.

8.3 **Deletion/erasure**: Where applicable, we will delete or anonymize Personal Data upon valid request and/or withdrawal of consent, subject to lawful exceptions (including where retention is required by law or necessary to defend legal claims or ensure platform safety).

---

## 9. Your Rights (DPDP Act)

Subject to applicable law and verification, you may have the right to:

9.1 **Access information** about the Personal Data processed by us and the manner of processing.

9.2 **Correction and updating** of inaccurate or incomplete Personal Data.

9.3 **Erasure** of Personal Data that is no longer necessary for the stated purposes, subject to lawful retention requirements.

9.4 **Withdraw consent** for optional processing (see Section 5).

9.5 **Grievance redressal** by contacting our Grievance Officer (Section 18).

9.6 **Nominate** another individual to exercise your rights in the event of your death or incapacity (where applicable under DPDP Act).

We may require you to verify your identity before acting on requests.

---

## 10. Security Practices and Breach Disclaimer

10.1 We implement reasonable security practices and procedures designed to protect Personal Data against unauthorized access, alteration, disclosure, or destruction. These measures may include access controls, encryption in transit, monitoring, and administrative safeguards.

10.2 **No system is completely secure**. You acknowledge that transmission of information over the internet and mobile networks is not fully secure and that we cannot guarantee absolute security.

10.3 In the event of a data breach, we will take reasonable steps to investigate, mitigate, and comply with applicable legal obligations.

---

## 11. No Guarantee; Platform Limitations

11.1 The Platform, including location, ETA, and communications features, is provided on an “as is” and “as available” basis.

11.2 We do not guarantee uninterrupted availability, accuracy, reliability, or timeliness of any feature due to factors outside our control including network availability, device limitations, third-party service outages, GPS inaccuracies, and platform maintenance.

---

## 12. Children / Minors

12.1 The Platform is intended for individuals who can form a legally binding contract under applicable law.

12.2 We do not knowingly collect Personal Data of children. If you believe a child has provided Personal Data, contact the Grievance Officer and we will take reasonable steps to delete such data subject to legal requirements.

---

## 13. Intermediary & User Content (IT Rules 2021)

13.1 Helparo may act as an "intermediary" for certain user-generated content (including messages, reviews, and uploads), as applicable.

13.2 You are responsible for the legality and accuracy of the information you submit. You agree not to upload or transmit unlawful content, infringing content, or content that violates applicable law or our policies.

13.3 We may remove or restrict content and suspend accounts where required by law or as necessary to protect the Platform, users, or Helparo.

---

## 14. Cookies and Tracking Technologies

14.1 We use cookies and similar technologies to:

- keep you signed in and maintain session integrity;
- remember preferences;
- measure performance and usage;
- prevent fraud and improve security.

14.2 You may manage cookies through your browser settings. Disabling cookies may affect functionality.

---

## 15. Government, Law Enforcement, and Legal Requests

15.1 We may disclose Personal Data if required to do so by law, regulation, court order, or valid legal process.

15.2 We may also disclose Personal Data where necessary to:

- investigate, prevent, or take action regarding illegal activities, suspected fraud, or security issues;
- enforce our terms, policies, and agreements; or
- protect the rights, property, or safety of Helparo, our users, Helpers, or the public.

---

## 16. Force Majeure and Technical Failure

Helparo shall not be liable for any failure or delay in performance resulting from events beyond reasonable control, including acts of God, natural disasters, governmental actions, network failures, outages of third-party providers, strikes, civil unrest, or cyber incidents.

---

## 17. Limitation of Liability and Indemnity

17.1 **Limitation of liability**: To the maximum extent permitted by law, Helparo shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or any loss of profits, revenue, goodwill, data, or business opportunity arising out of or related to this Policy or the processing of Personal Data.

17.2 **No responsibility for third parties**: Helparo is not responsible for the privacy practices of third parties (including Helpers, payment providers, and external websites/services) except to the extent required by law.

17.3 **Indemnity**: You agree to indemnify and hold harmless Helparo, its officers, directors, employees, and agents from and against claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of or related to your misuse of the Platform, violation of applicable law, or breach of this Policy.

---

## 18. Grievance Officer and Contact Details

In accordance with applicable law, you may contact our Grievance Officer for privacy concerns, complaints, and requests.

**Grievance Officer:** [Name]

**Designation:** Grievance Officer

**Email:** grievance@helparo.in

**Address:** [Registered Address], India

**Working hours:** [Days and Hours]

We will acknowledge and respond to grievances within timelines prescribed under applicable law.

---

## 19. Changes to This Policy

We may update this Policy from time to time. The updated version will be posted on the Platform with a revised “Last updated” date. Your continued use of the Platform after changes constitutes acceptance of the updated Policy to the extent permitted by law.

---

## 20. Governing Law, Dispute Resolution, Arbitration, and Jurisdiction

20.1 This Policy shall be governed by and construed in accordance with the laws of India.

20.2 **Arbitration**: Any dispute arising out of or in connection with this Policy shall be referred to and finally resolved by arbitration in India in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be **[City], India**. The arbitration shall be conducted in English by a sole arbitrator appointed mutually by the parties. 

20.3 **Courts**: Subject to the arbitration clause above and to the extent permissible, the courts at **[City], India** shall have exclusive jurisdiction.
  $$,
  true
)
ON CONFLICT (type, audience, version)
DO UPDATE SET
  title = EXCLUDED.title,
  content_md = EXCLUDED.content_md,
  is_active = EXCLUDED.is_active;

COMMIT;
