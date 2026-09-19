# -*- coding: utf-8 -*-
"""One-shot writer for Terms of Use + Privacy Policy markdown pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "frontend" / "hugo-landing" / "content"

TERMS = r'''+++
title = "Terms of Service"
type = "page"
layout = "policy-single"
effective_date = "October 24, 2024"
last_updated = "March 30, 2026"
description = "HeeRise Terms of Use Agreement"
+++

<div class="policy-notice"><strong>PLEASE READ THESE TERMS OF USE (THESE "TERMS") CAREFULLY</strong> before accessing or using the HeeRise platform. These Terms constitute a legally binding contract between you ("User," "you," or "your") and HeeRise, LLC ("HeeRise," "Company," "we," "us," or "our"), governing your access to and use of the HeeRise website, applications, sub-domains, APIs, content, tools, career coaching platforms, vocational boot camps, and associated software-as-a-service offerings (collectively, the "Services").</div>

<p><strong>SECTION 15</strong> of these Terms contains a mandatory binding arbitration agreement and class action waiver requiring you and HeeRise to resolve disputes through final and binding arbitration on an individual basis rather than through jury trials or class actions, subject to applicable law.</p>

<p>By creating an account, clicking "I Accept," subscribing to a paid service, enrolling in a cohort boot camp, or otherwise using the Services, you expressly agree to be bound by these Terms and all policies incorporated herein by reference, including our <a href="/privacy-policy/">Privacy Policy</a>. If you do not agree to these Terms in their entirety, you must cease all use of the Services immediately.</p>

## Section 1: Acceptance of Terms, Legal Capacity, and Age Eligibility

### 1.1 Binding Contractual Agreement
Access to and use of the Services is conditioned entirely upon your compliance with these Terms. By accessing our platform, you acknowledge that you have read, understood, and consented to these Terms.

### 1.2 Eligibility and Legal Capacity
You represent and warrant that you possess the full legal right, capacity, and authority to enter into these Terms under the laws of the jurisdiction in which you reside. The Services are intended exclusively for individuals who are at least eighteen (18) years of age or the age of legal majority in their home jurisdiction. If you are under the age of eighteen (18), you are strictly prohibited from creating an account, accessing the platform, or submitting personal data to the Services.

### 1.3 Jurisdictional Scope
The platform is administered and operated from facilities within the Commonwealth of Pennsylvania, United States. HeeRise makes no representations or warranties that materials, tools, immigration guidance, or career placement resources available via the Services are appropriate, lawful, or operational outside the United States. Users accessing the Services from international jurisdictions do so entirely at their own volition and assume sole legal responsibility for compliance with local legal requirements.

## Section 2: Description of Services, Account Architecture, and Security

### 2.1 Platform Functional Scope
HeeRise provides an adaptive, artificial intelligence-powered career transition and skill development infrastructure specifically tailored to international students, recent graduates, and professionals with educational or humanities backgrounds transitioning into technical and corporate roles within the United States. Core functionalities encompass:

- Interactive onboarding assessments evaluating educational credentials, soft competencies, and professional objectives;
- Proprietary and third-party algorithmic mapping models delivering tailored role discovery paths, including Instructional Designer, Learning and Development Specialist, EdTech Product Manager, Prompt Engineer, and AI Ethics Specialist;
- AI-driven skill gap analyses, adaptive learning sprints, and project-based learning modules;
- Career application transformation tools, including the Smart Resume Builder, Cover Letter Generator, and ATS Optimization Engines;
- AI Mock Interview simulators providing automated feedback regarding communication delivery, role alignment, and cultural interview norms;
- Project portfolio hosting ("My Pivot Portfolio") enabling users to showcase practical projects, instructional designs, and e-learning prototypes;
- Smart Mentor Matching and peer discussion forums; and
- Cohort-based educational offerings, including the HeeRise Instructional Design Boot Camp.

### 2.2 Account Registration and True Identity Verification
To access key features, you must complete an account registration process. You agree to provide true, accurate, current, and complete registration information regarding your identity, academic history, educational background, and visa status, and you agree to promptly update such data to ensure continuous accuracy. Registering under fictitious names, misrepresenting educational credentials, or assuming another person's identity is strictly prohibited and constitutes grounds for immediate account termination without refund.

### 2.3 Credential Security and Non-Transferability
You are solely responsible for maintaining the strict confidentiality of your account credentials, login email, and security tokens. Accounts are granted on a strictly personal, non-transferable basis. You may not rent, sell, assign, lease, share, or transfer your login access to any third party. You accept sole legal and financial responsibility for all activities, actions, and transactions executed through your account credentials. You agree to notify HeeRise immediately at <a href="mailto:security@heerise.com">security@heerise.com</a> if you suspect or identify any unauthorized access, compromise, or security breach.

## Section 3: Professional Regulatory Disclaimers: Non-Legal and Non-Immigration Advice

### 3.1 No Provision of Legal or Immigration Advice
<strong>HEERISE IS NOT A LAW FIRM, AN IMMIGRATION CONSULTANCY, OR A REGULATED LEGAL PRACTICE.</strong> No employee, officer, agent, developer, contractor, or system affiliated with HeeRise is acting as your attorney or legal counsel. The Services—including our "Visa & Immigration Resource Hub," visa timeline guidance, curated sponsorship data, "Ask the Coach" responses, and AI-generated assessments regarding F-1 visas, Curricular Practical Training (CPT), Optional Practical Training (OPT), STEM OPT extensions, Cap-Gap extensions, H-1B specialty occupation petitions, and permanent residency—are provided solely for general informational and educational purposes.

### 3.2 No Attorney-Client Relationship Formed
Your access to, communication with, or utilization of the Services does not in any circumstance create, constitute, or imply an attorney-client relationship between you and HeeRise, its affiliates, or any third-party mentors. Communications transmitted via the platform are not covered by attorney-client privilege or the work-product doctrine.

### 3.3 Pennsylvania Unauthorized Practice of Law Compliance
In strict accordance with 42 Pa.C.S. § 2524 and Pennsylvania judicial doctrines restricting the practice of law to duly licensed members of the Bar of the Commonwealth of Pennsylvania, HeeRise does not: (a) render advice regarding your specific legal rights, remedies, or status; (b) prepare, review, or execute formal immigration applications, petitions, or USCIS filings; (c) assess or certify the legality of your employment authorization; or (d) represent you before United States Citizenship and Immigration Services (USCIS), the U.S. Department of State, the U.S. Department of Labor, or any administrative tribunal.

### 3.4 Independent Legal and Institutional Verification
You expressly acknowledge that immigration laws, USCIS policy memoranda, and Department of Homeland Security directives are subject to frequent, retroactive, and unpredictable statutory and administrative revisions. You are exclusively responsible for independently confirming all visa protocols, work authorizations, and reporting requirements with a licensed U.S. immigration attorney and your university's Designated School Official (DSO) prior to making any academic, employment, relocation, or application decisions. HeeRise shall have no liability for immigration penalties, accrual of unlawful presence, termination of SEVIS records, denial of Employment Authorization Documents (EAD), or removal proceedings arising out of your reliance on platform materials.

## Section 4: Vocational and Employment Disclaimers: Absence of Guarantees

### 4.1 No Employment or Hiring Guarantees
<strong>HEERISE IS NOT AN EMPLOYMENT AGENCY, STAFFING SERVICE, VOCATIONAL PLACEMENT FIRM, OR DIRECT RECRUITMENT ENTITY.</strong> HeeRise does not guarantee, warrant, or promise that your use of the Services, completion of learning modules, participation in boot camps, engagement in mock interviews, or interaction with mentors will result in: (a) interview invitations; (b) formal job offers; (c) employer-sponsored visas (H-1B, O-1, TN, etc.); (d) promotions; or (e) retention of existing employment.

### 4.2 No Earnings, Compensation, or Salary Claims
Any salary ranges, compensation benchmarks, or remuneration data displayed across role discovery paths, pathway deep dives, marketing materials, or social media accounts (including Instagram, LinkedIn, and RedNote) are estimated aggregations derived from public data sources (e.g., the U.S. Bureau of Labor Statistics). They are presented purely as hypothetical, illustrative comparisons. HeeRise makes no representation or warranty that you will earn any specific income level, base salary, or contracting rate upon mastering the skills taught within the platform. You acknowledge that compensation in the United States job market depends entirely upon external macroeconomic factors, corporate hiring budgets, individual aptitude, regional variations, interview performance, and independent employer discretion.

### 4.3 Algorithmic Readiness Metrics Are Non-Binding
All "Career Readiness Scores," "Market Relevancy Metrics," "Skill Proficiency Trackers," and automated evaluation metrics constitute subjective, heuristic estimations produced by machine-learning models for motivational and educational structuring. They do not constitute official accreditation, formal certifications, or professional endorsements recognized by any corporate employer, accrediting body, or governmental agency.

### 4.4 Employer Directory and ATS Limitations
HeeRise provides curated information identifying historically visa-friendly employers and offering ATS (Applicant Tracking System) resume parsing alignment. We do not endorse, vet, represent, or enter into agency relationships with any listed employer. We cannot guarantee that any listed employer will accept your application, entertain candidacy, maintain open positions, or provide immigration petition sponsorship.

## Section 5: Generative AI Architecture, System Accuracy, and Provider Dependencies

### 5.1 Inherent Probabilistic Nature of Artificial Intelligence
You acknowledge that the Services incorporate third-party and proprietary generative artificial intelligence technologies, including deep learning models and large language models powered by Google Cloud Vertex AI and the Google Gemini API framework. Content generated by artificial intelligence models is stochastic, probabilistic, and prone to technical limitations. Such models may produce inaccurate, out-of-date, incomplete, culturally non-standard, or entirely fabricated information ("hallucinations").

### 5.2 User Duty to Verify
You assume total responsibility and legal risk for your utilization of, or reliance upon, any AI-generated materials, resume revisions, cover letter drafts, prompt formulations, interview feedback, or learning roadmaps. You agree that you will not rely upon any AI-synthesized output as an objective source of factual truth or professional advice. You agree to inspect, review, proofread, and verify all AI outputs prior to disseminating, submitting, or relying upon such materials in any formal job application, university interaction, or immigration filing.

### 5.3 Non-Exclusivity and Similarity of Outputs
You understand that due to the generative mechanics of large language models, identical, substantially similar, or overlapping prompts submitted by other users may yield identical, substantially similar, or overlapping outputs. HeeRise provides no warranty that any machine-generated resume text, cover letter paragraph, or project concept generated for you will be unique, non-infringing, or distinct from content generated for third-party platform users.

### 5.4 Third-Party Infrastructure and API Availability
You acknowledge that the functionality of HeeRise relies upon network connectivity and API integrations with external cloud and model infrastructure, notably Google Cloud Platform, Google Vertex AI, and Firebase Authentication. HeeRise accepts no liability for system latency, service suspensions, API rate-limiting, technical downtime, security vulnerabilities, or API deprecations originating from such third-party providers.

## Section 6: Intellectual Property Rights and Content Allocations

### 6.1 Platform Proprietary Rights
Excluding User-Submitted Content and licensed third-party open-source components, all right, title, and interest in and to the Services—including all software, source code, object code, proprietary algorithms, recommendation engines, UI/UX designs, instructional databases, course materials, video lectures, visual assets, text compilations, trademarks, service marks, and trade secrets—are owned exclusively by HeeRise, LLC and its licensors, protected by United States and international intellectual property laws. Except as expressly stated herein, no express or implied license is granted to you regarding any proprietary intellectual property of HeeRise.

### 6.2 Limited Personal License
Subject to your ongoing compliance with these Terms and timely payment of applicable fees, HeeRise grants you a personal, revocable, non-exclusive, non-transferable, non-sublicensable, limited license to access and use the platform interface, view learning modules, and utilize career tools solely for your private, non-commercial educational upskilling and career navigation. Any commercial redistribution, reverse engineering, decompilation, scraping, or framing of platform architecture or instructional content is strictly prohibited.

### 6.3 User Content (Input)
You retain all existing ownership rights, title, and interest in and to any data, documents, educational histories, work portfolios, resumes, cover letters, and text prompts that you upload, transmit, or input into the Services ("Input" or "User Content").

### 6.4 License Grant to HeeRise
By submitting, uploading, or transmitting User Content to the Services, you grant HeeRise, its parent entities, subsidiaries, and operational subcontractors a perpetual, worldwide, non-exclusive, royalty-free, fully paid-up license to host, store, reproduce, cache, process, modify, and transmit such User Content solely to the extent technically necessary to:

- Deliver, maintain, execute, and troubleshoot the Services for your benefit;
- Comply with statutory legal obligations, judicial subpoenas, and regulatory requests;
- Enforce these Terms and safeguard community trust and technical integrity; and
- Generate aggregated, strictly de-identified, and anonymized analytical benchmarks to assess market demand and platform efficacy.

### 6.5 Generative AI Enterprise Data Processing Protections
HeeRise commits that your proprietary, identified User Content (including resumes, academic transcripts, and professional histories) submitted to enterprise generative endpoints (via Google Cloud Vertex AI and enterprise API keys) will not be used to train, retrain, or fine-tune public baseline commercial AI models without your prior express written authorization, consistent with Google Cloud enterprise data privacy frameworks and Zero Data Retention configurations.

### 6.6 AI-Generated Content (Output)
As between you and HeeRise, to the maximum extent permitted by applicable law, HeeRise assigns and transfers to you all of its right, title, and interest (if any) in and to the specific text completions, rewritten resumes, synthesized cover letters, and analytical evaluations generated directly for you by the Services ("Output"). You expressly acknowledge that under prevailing United States copyright law, purely AI-generated expressions lacking human creative authorship cannot be registered with the U.S. Copyright Office and may not be legally protectable against third-party copying. You bear exclusive responsibility for incorporating human editing, creative expression, and factual customization into any Output to establish individual copyright ownership and ensure professional integrity.

### 6.7 Feedback License
If you submit any suggestions, concepts, enhancement requests, or critiques regarding platform performance ("Feedback") to HeeRise, you agree that such Feedback is entirely non-confidential and becomes the sole, exclusive property of HeeRise. HeeRise may freely deploy, commercialize, copy, and exploit such Feedback without any compensation, attribution, or accounting obligation to you.

## Section 7: User Portfolio Showcase and Project-Based Learning Assets

### 7.1 My Pivot Portfolio Rights
The Services offer functionality allowing users to build, host, and showcase practical projects, e-learning storyboards, Articulate 360 files, instructional wireframes, and curriculum artifacts ("Portfolio Assets") to demonstrate competence to potential corporate employers. You retain full ownership of the intellectual property embodied within your original Portfolio Assets.

### 7.2 Representations Regarding Third-Party Intellectual Property
You represent and warrant that your Portfolio Assets: (a) are your original work or are incorporated under valid, verified third-party licenses (e.g., Creative Commons, permissible corporate open-source frameworks); (b) do not infringe or misappropriate any patent, copyright, trademark, trade secret, or proprietary right of any third party; (c) do not breach any confidentiality, non-disclosure, or proprietary information agreement executed with prior employers, universities, or internship providers; and (d) do not include unauthorized client data, personally identifiable information of students from past practicums, or classified organizational materials.

### 7.3 Public Display and Third-Party Access
By designating any Portfolio Asset as "Public" or sharing public portfolio URLs with external recruiters, you acknowledge that such assets can be viewed, copied, downloaded, or indexed by third-party search engines or prospective employers. HeeRise bears no legal responsibility for any unauthorized copying, infringement, or commercial use of your publicly shared Portfolio Assets by external third parties.

## Section 8: Mentorship Network, Independent Contractor Status, and Peer Community Conduct

### 8.1 Independent Contractor Classification of Mentors
The platform facilitates connections between users and alumni, industry practitioners, and career coaches through matching algorithms, guided mentorship structures, and webinar panels. You expressly acknowledge that all participating Mentors, Guest Lecturers, and Industry Experts are independent third-party volunteers or independent contractors, and <strong>are not employees, agents, partners, or legal representatives of HeeRise</strong>.

### 8.2 No Supervision of Mentoring Advice
HeeRise does not direct, supervise, control, or validate the specific statements, career assertions, employment evaluations, or personal advice provided by Mentors during 1-on-1 calls, project critiques, or community discussions. You understand that guidance provided by a Mentor reflects solely their personal professional opinion and does not constitute the official position or guarantee of HeeRise.

### 8.3 Prohibition of Direct Compensation and Off-Platform Solicitation
All paid mentorship arrangements, scheduled sessions, and cohort reviews must be initiated, scheduled, and transacted exclusively through the HeeRise platform architecture. Users and Mentors are strictly prohibited from soliciting, offering, or accepting direct payments, off-platform advisory retainers, or private commercial transactions outside the platform to circumvent platform fees or contractual protections.

### 8.4 Community Conduct Standards
HeeRise fosters a collaborative, safe, and professional learning environment. In all community channels, forums, live webinars, and direct messages, you agree not to:

- Harass, threaten, demean, stalk, abuse, or defame any user, mentor, instructor, or staff member;
- Discriminate against, disparage, or marginalize any individual based upon race, nationality, visa classification, gender, sexual orientation, disability, religion, or age;
- Distribute spam, chain letters, commercial solicitations, multi-level marketing promotions, or unauthorized advertisements;
- Engage in academic dishonesty, plagiarism, sharing boot camp assignment answers, or circumventing grading rubrics; or
- Post obscene, sexually explicit, defamatory, or unlawful materials.

### 8.5 Content Moderation and Removal
HeeRise reserves the right, but does not undertake the affirmative obligation, to monitor, edit, flag, restrict, or delete any community contribution, post, or message that violates these Terms or harms the collaborative integrity of the platform, without prior notice or liability.

## Section 9: Subscription Mechanics, Automatic Renewals, and Boot Camp Tuition Policies

### 9.1 Commercial Architecture
HeeRise operates under a multi-tiered commercial model consisting of: (a) Free Tier access providing baseline assessments and restricted content libraries; (b) Premium Recurring SaaS Subscriptions granting access to advanced AI coaching tools, ATS modules, and role sprint engines; and (c) Cohort-Based Vocational Programs, notably the HeeRise Instructional Design Boot Camp.

### 9.2 Payment Processing and Billing Authorization
All payments are processed through PCI-DSS compliant third-party payment processors (e.g., Stripe). By supplying a credit card, debit card, or other approved payment method, you represent and warrant that you are legally authorized to utilize such instrument and authorize HeeRise (via its payment gateways) to charge the designated payment method for all applicable fees, including recurring subscription charges, boot camp tuition, and applicable state or municipal sales taxes.

### 9.3 Subscription Terms and Automatic Recurring Billing

**Express Consent to Auto-Renewal.** If you enroll in a paid recurring subscription (monthly, quarterly, or annually), your subscription will automatically renew at the conclusion of each billing interval, and your designated payment method will be charged the then-applicable subscription rate unless you cancel prior to the expiration of the current billing cycle.

**Pre-Enrollment Disclosures.** The recurring billing interval, renewal price, duration, and cancellation cutoff time will be disclosed to you adjacent to the subscription purchase confirmation prior to the submission of payment credentials.

**"Click-to-Cancel" Cancellation Mechanism.** In compliance with the Federal Trade Commission's Negative Option Rule (16 C.F.R. Part 425) and applicable state automatic renewal statutes, HeeRise provides an online cancellation mechanism. You may cancel your recurring subscription at any time without contacting customer support by navigating to Account Settings > Billing & Subscriptions > Cancel Subscription. Cancellation takes effect at the end of the current, fully paid billing period; you will retain platform access through that date, but no pro-rated refunds will be issued for partial subscription periods.

### 9.4 Boot Camp Tuition, Enrollment, and Withdrawal Schedule

Tuition for the HeeRise Instructional Design Boot Camp is established at standard, early bird, pilot cohort, and scholarship tiers as published on the applicable cohort enrollment schedule. Standard enrollment tuition is set at $2,000 USD; early-bird registration is priced at $1,799 USD; pilot cohort tuition is discounted to $1,500 USD (subject to availability); and merit/diversity scholarships are awarded at the sole discretion of HeeRise.

Enrollment may require a non-refundable seat deposit (typically $250 USD, credited toward total tuition) to secure cohort placement and software licensing allocations (e.g., Articulate 360 licenses, external LMS access).

| Formal Withdrawal Notice Delivered | Refundable Percentage of Total Tuition | Retained Administrative Fees & Deductions |
| --- | --- | --- |
| ≥ 14 Calendar Days Prior to Cohort Start Date | 100% of Tuition Paid | Non-refundable seat deposit ($250 USD) retained |
| 1 to 13 Calendar Days Prior to Cohort Start Date | 75% of Tuition Paid | Non-refundable seat deposit ($250 USD) retained |
| Day 1 through Day 7 of Cohort Instruction | 50% of Tuition Paid | Deducts $250 seat deposit and $150 software provisioning fee |
| After Day 7 of Cohort Instruction | 0% (Strictly Non-Refundable) | Total tuition forfeited; full payment balance remains due and payable |

Formal withdrawal notice must be transmitted in writing via electronic mail to <a href="mailto:admissions@heerise.com">admissions@heerise.com</a> with the subject line "Cohort Withdrawal Request." The effective timestamp of the email constitutes the legal submission date governing refund eligibility.

HeeRise reserves the right to immediately dismiss any boot camp participant who breaches community conduct guidelines, engages in academic plagiarism, or disrupts cohort environments. Dismissals executed under this provision result in immediate forfeiture of all paid tuition without right of refund.

## Section 10: Acceptable Use Policy and System Security Prohibitions

### 10.1 Lawful Use Only
You agree to access and utilize the Services strictly for legitimate, lawful, personal career development purposes in compliance with these Terms and all applicable federal, state, local, and international laws.

### 10.2 System and Security Prohibitions
You agree that you shall not, directly or indirectly:

- Decompile, reverse engineer, disassemble, decrypt, or attempt to derive the underlying source code, algorithms, logic, or architecture of the Services or AI recommendation systems;
- Use automated web crawlers, spiders, scrapers, data-mining scripts, or automated extraction tools to harvest data, content, course modules, mentor profiles, or job postings from the Services without prior written authorization;
- Probe, scan, or test the vulnerability of any HeeRise system, network, cloud server, or security framework, or attempt to breach any authentication or authorization mechanisms;
- Interfere with, disable, disrupt, or impose an unreasonable computational load upon the servers, databases, networks, or cloud infrastructure hosting the platform;
- Introduce viruses, Trojan horses, worms, logic bombs, malware, or other destructive code into the platform ecosystem;
- Circumvent or modify any digital rights management protocols, watermarks, provenance metadata, or security controls embedded in platform content; or
- Utilize any output, curriculum, or materials acquired through the Services to train, fine-tune, benchmark, or validate any competing artificial intelligence model, machine-learning tool, or vocational SaaS product.

## Section 11: Third-Party Integrations, External Links, and Aggregated Job Boards

### 11.1 Third-Party Integrations
The Services incorporate integrations, hyperlinks, and interactive connections to third-party tools, corporate databases, career portals, and professional networks, including LinkedIn, Google Workspace, Coursera, Udemy, Handshake, and external Applicant Tracking Systems.

### 11.2 No Endorsement or Liability for Third Parties
Third-party web properties and API services are not owned, operated, controlled, or audited by HeeRise. The inclusion of external hyperlinks or corporate listings does not imply endorsement, sponsorship, affiliation, or certification by HeeRise. HeeRise assumes no legal liability for: (a) the content, terms of service, privacy practices, or availability of third-party platforms; (b) the accuracy of external course content, certifications, or professional resources; or (c) employment terms, workplace conditions, visa sponsorship validity, or communication practices of external companies listing vacancies within our job boards. You access and interact with third-party web properties entirely at your own discretion and legal risk.

## Section 12: Disclaimer of Warranties

### 12.1 "As-Is" and "As-Available" Provision
To the maximum extent permitted by the laws of the Commonwealth of Pennsylvania and applicable federal statutes, the Services, including all content, software, artificial intelligence outputs, resume rewrites, career roadmaps, mentor interactions, boot camp sessions, and third-party integrations, are delivered on an "AS IS" and "AS AVAILABLE" basis, with all faults and defects.

### 12.2 Exclusion of All Statutory and Implied Warranties
HeeRise, on behalf of itself, its directors, officers, employees, affiliates, agents, and licensors, expressly disclaims all warranties of any nature, whether express, implied, statutory, or otherwise, including without limitation:

- The implied warranties of merchantability, fitness for a particular purpose, and non-infringement;
- Warranties arising out of course of dealing, usage, performance, or trade practice;
- Warranties that the Services will meet your career requirements, operate without service interruptions, meet performance thresholds, achieve intended vocational results, or be fully compatible with any system or software; and
- Warranties regarding the absence of defects, bugs, server outages, data loss, cyber incidents, transmission errors, or generative AI inaccuracies.

### 12.3 Pennsylvania Consumer Protection Preservation
Certain jurisdictions, including provisions within the Commonwealth of Pennsylvania Unfair Trade Practices and Consumer Protection Law (73 P.S. §§ 201-1 et seq.), do not permit the exclusion of certain implied warranties or statutory mandates. In such jurisdictions, the foregoing exclusions shall apply to the fullest extent permissible under applicable state law.

## Section 13: Limitation of Liability and Release

### 13.1 Exclusion of Indirect and Consequential Damages
To the fullest extent permissible under applicable law, under no circumstances or legal theory (whether sounding in contract, tort, negligence, strict liability, statutory duty, or otherwise) shall HeeRise, its affiliates, officers, directors, investors, employees, agents, or third-party licensors be liable to you or any third party for any indirect, incidental, special, exemplary, punitive, or consequential damages; damages for loss of actual or anticipated profits, contractual revenue, commercial goodwill, employment opportunities, salary advancement, or business reputation; expenses, sanctions, loss of legal immigration status, accrual of unlawful presence, cancellation of visas, expulsion, or SEVIS terminations arising from reliance on the Services; damages resulting from data loss, software malfunctions, platform interruptions, or generative AI inaccuracies; or costs associated with procuring substitute vocational or educational goods and services. The foregoing exclusions shall apply even if HeeRise has been advised of the possibility of such damages, and even if any remedy fails of its essential purpose.

### 13.2 Aggregate Financial Liability Cap
In no event shall the total, aggregate financial liability of HeeRise and its affiliates arising out of, connected with, or relating to these Terms, the platform, or the use of the Services exceed the greater of: (a) the total fees actually paid by you to HeeRise for the specific service giving rise to the claim during the twelve (12) months immediately preceding the act or event giving rise to liability; or (b) one hundred United States dollars ($100.00 USD).

### 13.3 Pennsylvania Jurisprudential Harmonization
The parties agree that the limitations of liability set forth in this Section 13 are commercially reasonable, constitute an essential basis of the bargain between the parties, and reflect the allocation of risk upon which fees have been structured. Nothing in these Terms shall limit or exclude liability for gross negligence, willful misconduct, or intentional fraud committed by HeeRise where such liability cannot be lawfully disclaimed under Pennsylvania law.

### 13.4 Statute of Limitations Bar
Regardless of any statutory provision to the contrary, you agree that any cause of action, suit, or legal claim arising out of or related to the Services must be commenced within one (1) year after the claim or cause of action accrues, or be forever barred.

## Section 14: Indemnification Obligations

### 14.1 Scope of User Indemnity
You agree to defend, indemnify, and hold harmless HeeRise, LLC, its parent entities, subsidiaries, affiliates, officers, directors, members, managers, employees, agents, software licensors, mentors, and independent contractors from and against any and all third-party claims, administrative investigations, liabilities, demands, damages, losses, settlements, judgments, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of, resulting from, or relating to:

- Your access to, misuse of, or conduct upon the Services;
- Any User Content, resume text, project asset, or portfolio item uploaded, shared, or distributed by you, including claims alleging copyright infringement, trademark infringement, trade secret misappropriation, or breach of non-disclosure duties;
- Your violation of any provision of these Terms or any incorporated platform rules;
- Your misrepresentation of your professional qualifications, academic degrees, transcripts, or immigration and visa status; or
- Your violation of any applicable federal, state, local, or international statute, including immigration regulations, unauthorized practice of law restrictions, or consumer protection standards.

### 14.2 Defense and Settlement Procedures
HeeRise reserves the right, at its own expense, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you agree to cooperate fully with HeeRise in asserting any available legal defenses. You may not settle, compromise, or agree to the entry of any judgment in any indemnified matter without the prior written consent of HeeRise.

## Section 15: Dispute Resolution, Mandatory Binding Arbitration, and Class Action Waiver

<div class="policy-notice"><strong>PLEASE READ THIS SECTION CAREFULLY.</strong> It mandates that disputes be resolved exclusively via binding arbitration and waives the right to a jury trial or to participate in a class action.</div>

### 15.1 Informal Dispute Resolution Mandate
Before initiating formal arbitration proceedings, you and HeeRise agree to make a good-faith effort to resolve any controversy, claim, or dispute informally. You must first transmit a written Notice of Dispute via electronic mail to <a href="mailto:legal@heerise.com">legal@heerise.com</a>. The Notice of Dispute must set forth your full name, account registration email, a narrative of the factual basis of the claim, and the specific relief sought. Both parties agree to engage in direct discussions for a minimum period of thirty (30) calendar days following receipt of the Notice before either party may initiate arbitration.

### 15.2 Mandatory Binding Individual Arbitration
If the dispute is not resolved through informal consultations within thirty (30) calendar days, any unresolved dispute, claim, or controversy arising out of, relating to, or in connection with these Terms, their interpretation, validity, breach, termination, or your use of the Services shall be submitted to and settled exclusively by final and binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules (or Consumer Arbitration Rules, if applicable). The Federal Arbitration Act (FAA) (9 U.S.C. §§ 1 et seq.) governs the interpretation and enforcement of this Section 15.

### 15.3 Arbitration Procedures and Venue
The arbitration shall be conducted before a single neutral arbitrator selected in accordance with AAA rules. The legal seat and place of arbitration shall be Philadelphia, Pennsylvania, or within Chester County, Pennsylvania, unless the parties mutually agree in writing to conduct the proceeding virtually or via written document submissions. The arbitration proceeding, filings, and arbitral award shall be conducted exclusively in the English language. The arbitrator shall possess the authority to grant monetary damages and temporary or permanent injunctive relief in accordance with Pennsylvania substantive law. The arbitrator's ruling and award shall be final, binding, and non-appealable, and judgment upon the award may be entered in any court possessing competent jurisdiction.

### 15.4 Class Action and Consolidation Waiver
You and HeeRise expressly agree that all claims, disputes, and causes of action shall be arbitrated on an individual basis and not in a class, consolidated, multi-plaintiff, representative, or collective proceeding. Neither you nor HeeRise shall have the right to participate as a class representative or class member in any court or arbitration proceeding brought against the other party. The arbitrator may not consolidate claims of more than one individual or preside over any form of a representative action.

### 15.5 Small Claims Court and Intellectual Property Exceptions
Notwithstanding the requirement for binding arbitration, either party retains the individual right to: (a) bring an individual action in a small claims court of competent jurisdiction within Chester County, Pennsylvania, provided the claim falls within the statutory jurisdictional limits of such court; or (b) seek emergency equitable or preliminary injunctive relief in a state or federal court located in Chester County or the Eastern District of Pennsylvania to halt the actual or threatened infringement, misuse, or misappropriation of intellectual property rights, system security compromises, or trade secrets.

### 15.6 Thirty-Day Opt-Out Window
You possess the right to opt out of the provisions of this Section 15 by transmitting written, signed notice of your election to opt out via email to <a href="mailto:arbitration-optout@heerise.com">arbitration-optout@heerise.com</a> within thirty (30) calendar days of first accepting these Terms. The opt-out communication must state your legal name, username, current address, and an unambiguous declaration that you decline the arbitration agreement. If you submit a valid opt-out notice, all other provisions of these Terms, including Section 16 (Governing Law and Forum Selection), shall remain in full force.

## Section 16: Governing Law, Exclusive Jurisdiction, and Forum Selection

### 16.1 Pennsylvania Substantive Law
These Terms, their interpretation, validity, performance, construction, and all disputes or claims arising out of or related to them or the Services (including non-contractual claims sounding in tort or statutory violation) shall be governed by, interpreted, and construed in accordance with the substantive laws of the Commonwealth of Pennsylvania, United States, without regard to its conflict-of-laws principles.

### 16.2 Forum Selection and Personal Jurisdiction
In any circumstance where Section 15 permits litigation in a court of law (including post-arbitral judgment confirmation, equitable intellectual property enforcement, or following a timely opt-out), you and HeeRise agree that all such judicial actions, suits, or proceedings shall be instituted exclusively in: (a) the Court of Common Pleas of Chester County, Pennsylvania (15th Judicial District); or (b) the United States District Court for the Eastern District of Pennsylvania. You and HeeRise submit to the personal jurisdiction and venue of such courts, and waive any defense or objection based upon lack of personal jurisdiction, improper venue, or forum non conveniens.

## Section 17: Notice and Takedown Procedure (DMCA Compliance)

### 17.1 Digital Millennium Copyright Act Compliance
HeeRise respects the intellectual property rights of creators and complies with the safe harbor provisions of the Digital Millennium Copyright Act (17 U.S.C. § 512).

### 17.2 DMCA Takedown Notification
If you believe that your copyrighted work has been reproduced, displayed, or distributed across the Services in a manner that constitutes copyright infringement, you must submit a written notification containing the following elements to our Designated Copyright Agent:

- A physical or electronic signature of a person authorized to act on behalf of the copyright owner;
- Identification of the copyrighted work claimed to have been infringed;
- Identification of the material claimed to be infringing and information reasonably sufficient to permit HeeRise to locate the material (e.g., direct URLs);
- Your contact information, including legal name, physical address, telephone number, and email address;
- A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law; and
- A statement, made under penalty of perjury, that the information in your notification is accurate and that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

### 17.3 Designated Copyright Agent Contact
Notifications of claimed infringement should be addressed to:

**HeeRise Legal Department – Copyright Agent**  
HeeRise, LLC  
Email: <a href="mailto:copyright@heerise.com">copyright@heerise.com</a>

### 17.4 Repeat Infringer Policy
HeeRise maintains a policy providing for the prompt suspension or termination of accounts belonging to users who are determined to be repeat copyright infringers.

## Section 18: General Contractual Provisions

### 18.1 Entire Agreement and Merger
These Terms, together with our Privacy Policy and any specific Cohort Boot Camp Enrollment Agreements executed by you, constitute the complete and exclusive agreement between you and HeeRise regarding your access to and use of the Services. These Terms supersede and replace all prior and contemporaneous agreements, negotiations, understandings, and representations, whether oral or written, regarding their subject matter.

### 18.2 Severability
If any provision of these Terms is determined by an arbitrator or court of competent jurisdiction to be unlawful, void, invalid, or unenforceable, such provision shall be enforced to the maximum extent permissible under applicable law to reflect the original intent of the parties. The remaining provisions of these Terms shall remain in full force and legal effect.

### 18.3 Waiver and Reservation of Rights
No failure, delay, or forbearance by HeeRise in exercising any right, power, or remedy under these Terms shall operate as a waiver of that right, power, or remedy. A waiver of any default or breach shall not constitute a waiver of any subsequent or continuing default or breach. All waivers must be executed in writing by an authorized representative of HeeRise to possess legal effect.

### 18.4 Assignment
You may not assign, sublicense, delegate, or transfer these Terms or any of your rights or obligations hereunder, by operation of law, change of control, or otherwise, without the prior express written consent of HeeRise. Any attempted assignment or delegation in violation of this clause is void. HeeRise may assign, transfer, or delegate these Terms, its corporate rights, and its performance obligations without restriction or prior notice to you.

### 18.5 Modifications to Terms
HeeRise reserves the right to amend, update, or modify these Terms at any time. Material changes will be communicated by updating the "Last Updated" timestamp at the top of these Terms and, where appropriate, via electronic notification to your registered email address or a prominent notice upon your account dashboard. Your continued access to or use of the Services following the posting of amended Terms constitutes your acceptance of such modifications. If you object to any modification, your sole remedy is to cancel your account and cease all utilization of the Services.

### 18.6 Electronic Communications
By using the Services, you consent to receive communications from HeeRise electronically, including system announcements, billing statements, password reset tokens, and legal notifications. You agree that all electronic notices, disclosures, agreements, and communications satisfy any legal requirement that such communications be in writing.

### 18.7 Force Majeure
HeeRise shall not be liable or deemed in default under these Terms on account of any failure, delay, or interruption in performance resulting from acts of God, civil unrest, utility failures, telecommunications or cloud hosting interruptions, third-party API deprecations, state or federal governmental actions, wars, national emergencies, pandemics, or any other cause beyond its reasonable control.

## Section 19: Contact and Regulatory Notice Information

If you have questions, inquiries, formal legal notices, or feedback regarding these Terms of Use, please contact HeeRise, LLC through the following official channels:

- **General Customer Support:** <a href="mailto:support@heerise.com">support@heerise.com</a>
- **Admissions & Boot Camp Administration:** <a href="mailto:admissions@heerise.com">admissions@heerise.com</a>
- **Legal Department & Dispute Communications:** <a href="mailto:legal@heerise.com">legal@heerise.com</a>
- **Arbitration Opt-Out Notifications:** <a href="mailto:arbitration-optout@heerise.com">arbitration-optout@heerise.com</a>

**Mailing Address:**  
HeeRise, LLC  
Attention: Legal & Regulatory Affairs  
Chester County, Pennsylvania, United States of America
'''

PRIVACY = r'''+++
title = "Privacy Policy"
type = "page"
layout = "policy-single"
effective_date = "October 24, 2024"
last_updated = "March 30, 2026"
description = "HeeRise Privacy Policy"
+++

<div class="policy-notice">This Privacy Policy explains how HeeRise, LLC ("HeeRise," "we," "us," or "our") collects, uses, shares, and protects personal information when you use the HeeRise website, applications, career coaching tools, Lumina simulation experiences, vocational boot camps, and related services (collectively, the "Services"). It should be read together with our <a href="/terms-of-service/">Terms of Service</a>.</div>

## 1. Who We Are
HeeRise is operated from the Commonwealth of Pennsylvania, United States. For privacy questions, contact <a href="mailto:legal@heerise.com">legal@heerise.com</a> or <a href="mailto:support@heerise.com">support@heerise.com</a>.

## 2. Information We Collect
Depending on how you use the Services, we may collect:

- **Identity and contact data:** full name, email address, and similar registration details (including Lumina SIM pre-registration).
- **Account and profile data:** academic history, educational background, visa status you choose to provide, career goals, and assessment answers.
- **Career content you upload ("User Content" / Input):** resumes, cover letters, portfolios, syllabi, transcripts, prompts, project files, and related materials.
- **Usage and technical data:** device/browser information, IP address, approximate location derived from IP, log data, cookies or similar technologies, and interaction events needed to operate and secure the Services.
- **Payment and enrollment data:** billing identifiers, product selections, and transaction metadata processed by PCI-DSS compliant processors (for example, Stripe). We do not store full card numbers on HeeRise servers.
- **Communications:** support messages, feedback, and legal notices you send us.
- **Optional marketing preferences:** whether you opt in to product updates, tips, and news.

We do not knowingly collect personal information from individuals under 18. If you believe a minor has submitted data, contact us and we will delete it.

## 3. How We Use Information
We use personal information to:

- Provide, personalize, maintain, and improve the Services (including AI coaching tools, assessments, portfolios, and simulation experiences);
- Create and secure accounts, authenticate users, and prevent fraud or abuse;
- Process registrations, enrollments, subscriptions, and tuition-related transactions;
- Generate AI-assisted outputs you request (for example, resume rewrites, cover letters, interview feedback, and learning guidance);
- Send transactional notices (security alerts, billing confirmations, service updates);
- Send marketing communications only where you have opted in, with an unsubscribe option;
- Comply with law, respond to lawful requests, and enforce our Terms;
- Create aggregated, de-identified analytics about product usage and market demand.

## 4. Generative AI and Enterprise Data Handling
The Services use generative AI capabilities powered through Google Cloud Vertex AI and the Google Gemini API framework for tasks such as skill translation, case-study grading, resume restructuring, cover letter synthesis, and mock interview evaluation.

- AI outputs can be incomplete, outdated, or inaccurate ("hallucinations"). You remain responsible for reviewing and verifying outputs before using them in applications, academic settings, or immigration contexts.
- Consistent with enterprise Google Cloud data-handling frameworks and Zero Data Retention configurations used for enterprise generative endpoints, HeeRise commits that your identified User Content submitted to those enterprise endpoints will <strong>not</strong> be used to train, retrain, or fine-tune public baseline commercial AI models without your prior express written authorization.
- We process, cache, and transmit data only as needed to deliver platform functionality, troubleshoot issues, and meet legal obligations.

## 5. How We Share Information
We may share personal information with:

- **Service providers / processors** that host infrastructure, authentication, analytics, email, or payments (including Google Cloud Platform / Firestore / Firebase Authentication, and payment processors such as Stripe), under contractual confidentiality and security obligations;
- **Mentors or instructors** only to the extent needed for a session or cohort you join;
- **Professional advisers** (legal, accounting) when reasonably necessary;
- **Authorities** when required by law, subpoena, or to protect rights, safety, and platform integrity;
- **Successors** in connection with a merger, acquisition, financing, or sale of assets, subject to this Policy's protections.

We do not sell personal information. We do not share personal information for cross-context behavioral advertising as those terms are commonly defined under U.S. state privacy laws, except where a specific integration you enable requires otherwise and is disclosed at the point of use.

## 6. Cookies and Similar Technologies
We use essential cookies and similar technologies for authentication, security, and basic site operation. Where analytics or preference tools are used, we limit them to what is needed to operate and improve the Services. You can control cookies through your browser settings; disabling certain cookies may limit functionality.

## 7. Data Retention
We retain personal information for as long as your account remains active and as needed to provide the Services, resolve disputes, enforce agreements, and meet legal, tax, and accounting requirements. Registration and simulation gate records may be retained for program administration and abuse prevention. When retention is no longer necessary, we delete or de-identify data in accordance with our operational procedures.

## 8. Security
We implement administrative, technical, and organizational measures designed to protect personal information, including access controls and encrypted transit where appropriate. No method of transmission or storage is completely secure; you use the Services at your own residual risk and must protect your account credentials.

## 9. Your Choices and Rights
Depending on your location, you may have rights to access, correct, delete, or export certain personal information, or to object to or restrict certain processing. You may also:

- Update account information where self-service tools are available;
- Withdraw marketing consent at any time;
- Cancel recurring subscriptions through the in-product Click-to-Cancel path described in the Terms;
- Request deletion or correction by emailing <a href="mailto:support@heerise.com">support@heerise.com</a> or <a href="mailto:legal@heerise.com">legal@heerise.com</a>.

We may need to verify your identity before fulfilling a request and may retain limited information as required by law.

## 10. International Users
The Services are administered from Pennsylvania, United States. If you access the Services from outside the United States, you understand that your information may be processed in the United States and other countries where our providers operate, which may have different data-protection laws than your home jurisdiction.

## 11. Children's Privacy
The Services are intended only for individuals 18 years of age or older (or the age of legal majority). We do not knowingly collect data from children.

## 12. Third-Party Links and Integrations
The Services may link to or integrate with third-party sites and tools (for example LinkedIn, Google Workspace, Coursera, Udemy, Handshake, or employer career pages). Their privacy practices are governed by their own policies. HeeRise is not responsible for third-party content or practices.

## 13. Changes to This Policy
We may update this Privacy Policy from time to time. Material changes will be reflected by updating the "Last Updated" date and, where appropriate, by email or in-product notice. Continued use of the Services after an update means you acknowledge the revised Policy.

## 14. Contact
HeeRise, LLC  
Attention: Legal & Regulatory Affairs  
Chester County, Pennsylvania, United States of America  

Email: <a href="mailto:legal@heerise.com">legal@heerise.com</a> · <a href="mailto:support@heerise.com">support@heerise.com</a>
'''

ROOT.mkdir(parents=True, exist_ok=True)
(ROOT / "terms-of-service.md").write_text(TERMS, encoding="utf-8")
(ROOT / "privacy-policy.md").write_text(PRIVACY, encoding="utf-8")
print("Wrote", ROOT / "terms-of-service.md", "bytes", (ROOT / "terms-of-service.md").stat().st_size)
print("Wrote", ROOT / "privacy-policy.md", "bytes", (ROOT / "privacy-policy.md").stat().st_size)
