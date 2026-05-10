PRODUCT REQUIREMENTS DOCUMENT (PRD)
Product Name

Estimato

Overview

Estimato is a SaaS platform for small cleaning businesses in Denmark (1–10 employees).
The platform enables companies to automatically generate cleaning quotes, capture leads, and allow customers to book services without manual work.

Target Audience
Small cleaning businesses in Denmark (1–10 employees)
Businesses with an existing website
Businesses that want more leads and less manual administrative work
Problem Statement
Cleaning companies spend too much time creating quotes manually
They lose leads due to slow or inconsistent follow-up
Value Proposition

Generate quotes and book customers automatically without manual work.

Pricing Model
Single plan: 499 DKK/month
14-day free trial (no credit card required)
All features included
Core Features (MVP)
1. Quote Generator (Lead Widget)

Each company has its own customizable quote generator that can be embedded on their website.

Inputs:
Address (used to fetch property data)
Property type (house, apartment, commercial)
Optional additional services
Data Enrichment:
Property size (m²) is automatically fetched from an external data source
Property type is automatically detected
Pricing Logic:

Companies can configure either:

Price per m²
OR
Fixed pricing intervals (e.g. 0–20 m² = X price, 21–40 m² = Y price)

Optional:

Add-ons (extra services with fixed price)
Discounts
Output:
Customer receives a real quote (not an estimate)
Price breakdown is shown (base price + add-ons/discounts)
2. Customer Actions (Post-Quote Flow)

After receiving a quote, the customer has 3 options:

A. Book Appointment
Customer enters:
Name
Email
Phone number
Customer selects available time slot from calendar
Booking is created in the system
B. Request Callback
Customer enters:
Name
Phone number
A lead is created
Company is notified to call the customer
C. Send Quote via Email
Customer enters:
Name
Email
Phone (optional)
Customer receives email with:
Quote details
Link to return and accept the quote later
3. Dashboard

Each company has access to a simple dashboard.

Dashboard Overview:
List of leads
List of bookings
Status indicators:
New
Contacted
Booked
4. Quote Configuration (Settings)

Companies can configure their own quote generator:

Pricing model:
Price per m² OR interval pricing
Add-ons (extra services)
Discounts
Minimum price (optional)
5. Calendar (MVP)
Companies define their opening hours (e.g. Mon–Fri 08:00–16:00)
System generates available time slots
Customers can only book within available slots
No external calendar integration in MVP
6. Lead Notifications

When a new lead is created:

Email Notification:

Includes:

Customer name
Address
Quote price
Selected action (book / callback / email)
Link to dashboard
SMS Notification:

Short message:

“New lead from [Name] – check your dashboard”
Dashboard:
Lead appears instantly with status
7. Embed System

Companies can embed the quote generator on their website using:

<script src="estimato.js"></script>
<div id="lead-widget"></div>
Widget is rendered inline
Styling and behavior are controlled from the platform
8. Signup & Onboarding Flow
User visits landing page (estimato.dk)
User signs up with email and password
Trial (14 days) is activated automatically
User accesses dashboard
User configures:
Pricing model
Opening hours
User receives embed script
User installs widget on their website
Data Models (High-Level)
Users / Companies
id
company_name
email
phone
subscription_status
trial_end_date
Leads
id
company_id
name
email
phone
address
price
status (new, contacted, booked)
created_at
Bookings
id
company_id
lead_id
date_time
status
Quote Settings
company_id
pricing_type (sqm or interval)
price_per_sqm
interval_ranges (JSON)
add_ons (JSON)
opening_hours (JSON)
Technical Requirements
Frontend
Dashboard UI
Embedded widget UI
Backend
Quote calculation logic
Lead handling
Booking system
Notification system
Integrations
SMS provider (e.g. Twilio)
Email service
External property data API (for m² and property type)
MVP Scope

Included:

Quote generator
Lead capture
Booking system
Dashboard
Notifications
Embed system

Excluded (future):

Calendar sync (Google/Outlook)
Advanced employee management
Advanced CRM features
Key Success Metric
Number of leads generated per company
Conversion rate from lead to booking
Reduction in manual quote handling