-- CUSTOMER TERMS v2 (risk-minimizing, customer audience)
-- This migration deactivates existing active customer terms and upserts v2 as active.

UPDATE legal_documents
SET is_active = FALSE
WHERE type = 'terms'
  AND audience = 'customer'
  AND is_active = TRUE;

INSERT INTO legal_documents (type, audience, version, title, content_md, is_active)
VALUES (
  'terms',
  'customer',
  2,
  'Helparo Customer Terms & Conditions (v2)',
  $$# Helparo Customer Terms & Conditions (v2)

**Last updated:** 2025-12-19

**IMPORTANT:** This document is a draft and does not constitute legal advice.

These Customer Terms ("**Terms**") govern your access to and use of Helparo as a customer ("**Customer**", "**you**"). By creating an account, accessing, browsing, requesting, booking, scheduling, communicating, paying for, or receiving any services through Helparo, you agree to be legally bound by these Terms.

## 1. Definitions

1.1 **"Helparo"**, **"we"**, **"us"**, **"our"** means the entity operating the technology platform under the brand name Helparo.

1.2 **"Platform"** means Helparo’s technology platform, including its website/web interfaces, through which Customers can request or book home services from independent service providers.

1.3 **"Helper"** means an independent third-party service provider (individual or entity) who offers and performs services for Customers using the Platform.

1.4 **"Services"** means home services offered and performed by Helpers (including, without limitation, electrical, plumbing, cleaning, repairs, installation, maintenance). **Helparo does not provide Services.**

1.5 **"Booking"** means a Customer request/order placed through the Platform for Services to be performed by a Helper.

1.6 **"Fees"** means amounts payable in relation to a Booking, including (as applicable) service charges, platform/service/convenience fees, cancellation/no-show charges, surcharges, taxes, and other charges displayed on the Platform.

1.7 **"Applicable Law"** includes, without limitation, the Information Technology Act, 2000 and rules thereunder, the Consumer Protection Act, 2019 (and related rules), the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 ("**Intermediary Rules**"), and the Arbitration and Conciliation Act, 1996, as amended.

## 2. Acceptance of Terms

2.1 **Binding agreement.** These Terms constitute a legally binding agreement between you and Helparo.

2.2 **Additional policies.** These Terms incorporate by reference any policies displayed on the Platform (including cancellation/refund policies, safety rules, prohibited use rules, and any booking-specific terms shown at checkout).

2.3 **No use if you disagree.** If you do not agree, you must not use the Platform.

## 3. Eligibility

3.1 You must be at least **18 years old** and capable of entering into a binding contract under Applicable Law.

3.2 You represent and warrant that all information provided by you is **true, accurate, current, and complete**.

3.3 You are responsible for maintaining the confidentiality of OTPs and access credentials. Any actions performed using your verified phone number/OTP are deemed authorized by you.

## 4. Platform Role (Intermediary Disclaimer – VERY STRONG)

4.1 **Intermediary only.** Helparo is a technology platform and an **intermediary** under the Information Technology Act, 2000 and the Intermediary Rules. Helparo only facilitates discovery, communication, booking coordination, and (where enabled) payment facilitation.

4.2 **No services by Helparo.** Helparo **does not** provide home services, does not supervise or control how services are performed, and does not guarantee outcomes.

4.3 **No employment/agency.** Helpers are **independent third parties** and are **not** employees, agents, representatives, partners, or joint venturers of Helparo. No Helper has authority to bind Helparo.

4.4 **No liability for Helper conduct or outcomes.** Helparo is not responsible or liable for **service quality, workmanship, delays, cancellations, rescheduling, disputes, pricing disputes, injuries, death, property damage, theft, loss, or any other harm** arising from or relating to Services or any interactions between you and a Helper.

4.5 **At your own risk.** YOU ACKNOWLEDGE AND AGREE THAT YOU ENGAGE HELPERS AND RECEIVE SERVICES ENTIRELY **AT YOUR OWN RISK**.

4.6 **No endorsement.** Any profiles, reviews, ratings, badges, or verification indicators are informational only and do not constitute a warranty, endorsement, certification, or guarantee by Helparo.

## 5. User Responsibilities

5.1 You shall provide accurate Booking details (address, contact, service description) and cooperate reasonably.

5.2 You are responsible for ensuring the service location is safe and lawful for the Helper to attend and work, including keeping minors/pets supervised and hazards controlled.

5.3 You must not:

- use the Platform for unlawful purposes, fraud, or misrepresentation;
- harass, abuse, threaten, or discriminate against Helpers;
- attempt to bypass the Platform (including off-platform payments or fee avoidance);
- upload or transmit unlawful, harmful, infringing, defamatory, obscene, or prohibited content;
- interfere with Platform security or operations (including scraping, reverse engineering, or automated access without authorization).

5.4 You are solely responsible for complying with Applicable Law at the service location (including building rules, housing society rules, permits, and safety requirements).

## 6. Booking, Pricing, Cancellations (No Guarantees)

6.1 **No guarantee of availability.** Helparo does not guarantee that any Helper will accept, attend, or complete any Booking.

6.2 **Estimates are not guarantees.** Any prices, quotes, time estimates, or availability shown are indicative and may change based on inspection, scope changes, materials, site conditions, or other factors.

6.3 **Cancellations/no-shows.** Bookings may be cancelled by you or a Helper. Cancellation/no-show charges may apply as displayed. Helparo is not responsible for any losses due to cancellation, delay, rescheduling, or non-performance.

6.4 **Scope changes.** Any additional work or materials require your explicit approval. You are responsible for verifying final charges and scope before confirming.

## 7. Payments & Refunds (Platform Not Liable)

7.1 Payments may be processed by third-party payment gateways/processors. Helparo does not control and is not liable for payment processor downtime, errors, failed transactions, reversals, or third-party misconduct.

7.2 If enabled, Helparo may collect platform/service/convenience/cancellation fees as displayed. Taxes may apply.

7.3 Refunds, if any, are governed strictly by the refund/cancellation policy shown at the time of Booking and may be conditional. Helparo does not guarantee any refund.

7.4 Chargebacks/payment disputes may result in suspension/restriction of your account and recovery of chargeback-related costs/penalties, to the maximum extent permitted by Applicable Law.

## 8. No Warranty / As-Is

8.1 THE PLATFORM IS PROVIDED ON AN **“AS IS”**, **“AS AVAILABLE”**, AND **“WITH ALL FAULTS”** BASIS.

8.2 To the maximum extent permitted by Applicable Law, Helparo disclaims all warranties (express, implied, statutory), including merchantability, fitness for a particular purpose, non-infringement, and availability.

8.3 Helparo does not warrant uninterrupted, timely, secure, or error-free operation, or any service outcomes.

## 9. Limitation of Liability (Cap Liability)

9.1 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HELPARO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL.

9.2 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HELPARO’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THE PLATFORM, THESE TERMS, OR ANY BOOKING SHALL NOT EXCEED THE LOWER OF:

- INR 1,000; OR
- THE PLATFORM FEES (IF ANY) ACTUALLY PAID BY YOU TO HELPARO IN THE 30 DAYS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.

9.3 You agree that these limitations are a fundamental basis of the agreement.

## 10. Indemnification

You agree to indemnify, defend, and hold harmless Helparo, its directors, officers, employees, affiliates, and agents from and against any claims, losses, liabilities, damages, penalties, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use or misuse of the Platform; (b) any Booking; (c) your breach of these Terms; (d) your violation of Applicable Law; (e) disputes between you and any Helper; or (f) any harm at the service location.

## 11. Third-Party Services Disclaimer

The Platform may rely on third-party services including payments, SMS/WhatsApp/calls, mapping/location services, analytics, and hosting. Helparo is not responsible for third-party availability, accuracy, security, or performance. Your use of third-party services is at your own risk and subject to third-party terms.

## 12. Suspension & Termination

Helparo may suspend, restrict, or terminate your access (in whole or part), with or without notice, if Helparo believes you have violated these Terms, engaged in fraud/abuse/unsafe conduct, or created risk or potential legal exposure for Helparo.

## 13. Force Majeure

Helparo shall not be liable for any failure or delay due to events beyond its reasonable control, including natural disasters, government actions, court orders, strikes, telecom/internet outages, payment network failures, epidemics/pandemics, civil unrest, or third-party disruptions.

## 14. Governing Law & Arbitration (India)

14.1 These Terms shall be governed by the laws of India.

14.2 Any dispute arising out of or relating to these Terms or the Platform shall be finally resolved by **arbitration** in accordance with the Arbitration and Conciliation Act, 1996.

14.3 The arbitration shall be conducted by a **sole arbitrator** appointed by Helparo. The **seat and venue** of arbitration shall be **[City], India**. The arbitration language shall be English.

14.4 Nothing prevents Helparo from seeking interim or injunctive relief from courts of competent jurisdiction in India.

## 15. Waiver of Class Action

To the maximum extent permitted by Applicable Law, you agree that disputes will be resolved only on an individual basis and you waive any right to participate in any class, collective, representative, or consolidated action/arbitration against Helparo.

## 16. Modification of Terms

Helparo may modify these Terms at any time. Updated Terms will be effective upon posting on the Platform (or a later stated effective date). Your continued use constitutes acceptance.

## 17. Electronic Record Declaration (IT Act)

You consent to contracting and transacting electronically. These Terms, consents, click-wrap acceptance, OTP verifications, and communications constitute electronic records under the Information Technology Act, 2000 and are admissible in evidence.

## 18. Contact & Grievance Redressal (Placeholder)

- **Customer Support:** support@helparo.in
- **Grievance Officer:** [Name], grievance@helparo.in
- **Address:** [Registered Office Address], India
- **Working Hours:** [Mon–Fri, 10:00–18:00 IST]

Helparo will acknowledge complaints within 24 hours and endeavor to resolve them within 15 days, as required under Applicable Law.

### Communications, Location, OTP, Payment & Data Consents

A. You consent to receive service-related communications from Helparo and/or Helpers via SMS, WhatsApp, phone calls, and other channels for OTPs, booking updates, coordination, support, and safety.

B. You consent to OTP-based verification and agree not to share OTPs. You are responsible for activities authenticated using OTP.

C. You consent to collection and use of device/usage/technical data for fraud prevention, security, analytics, and improving Platform functionality.

D. Where enabled and permitted by you, you consent to location access and/or location tracking for address confirmation, serviceability checks, navigation/coordination, fraud prevention, and safety features.

E. You consent to processing of payment information by authorized payment processors for completing transactions.

**MARKETPLACE ACKNOWLEDGEMENT:** Helparo is only an intermediary technology platform. Helpers are independent third parties. Services are availed at your own risk. Helparo is not liable for service outcomes or Customer–Helper disputes.
$$,
  TRUE
)
ON CONFLICT (type, audience, version)
DO UPDATE SET
  title = EXCLUDED.title,
  content_md = EXCLUDED.content_md,
  is_active = TRUE,
  published_at = timezone('utc'::text, now());
