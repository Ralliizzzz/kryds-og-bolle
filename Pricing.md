I want to expand the "Pricing & Add-ons" section in the dashboard.

The goal is to give each company full control over how they calculate prices.

Implement the following features:

---

1. PRICE PER SQUARE METER WITH INTERVALS

Extend the current price per m² logic to support intervals.

Each company should be able to:
- Define multiple intervals
- Each interval has:
  - min_m2
  - max_m2
  - price_per_m2

Example:
- 0–50 m² → 10 DKK per m²
- 51–100 m² → 8 DKK per m²

Requirements:
- Companies can dynamically add/remove intervals
- Intervals must not overlap
- UI should be simple and editable

---

2. HOURLY SERVICES (MAIN CLEANING & MOVE-OUT CLEANING)

Allow companies to enable/disable:
- Main cleaning
- Move-out cleaning

For each:
- Define hourly_rate (DKK per hour)

---

3. ADD-ONS (EXTRA FEES)

Companies can enable add-ons with custom pricing.

Predefined add-ons:
- Extra floor above ground level (apartments only)
- Extra bathroom beyond the first
- Extra floor level (houses)
- No free parking
- Pets (dog or cat)

Rules:
- Each add-on has a price field
- If price = 0, it should NOT be shown in the widget
- Companies can add custom add-ons:
  - name
  - price

---

4. FREQUENCY DISCOUNT

Allow companies to enable discounts based on cleaning frequency.

Options:
- Weekly
- Every 2 weeks
- Every 3 weeks
- Every 4 weeks

Each has:
- discount_percentage

---

5. TRANSPORT FEE

Allow companies to configure a driving fee.

Fields:
- base_distance_km (included distance)
- price_per_km (DKK per km after base distance)

Also:
- Company must input their address in settings
- Distance is calculated from company address to customer address

---

6. MISC SETTINGS

Add a "Miscellaneous" section:

Fields:
- minimum_booking_days_in_advance (integer)
- service_deduction_percentage (default = 26%)

---

GENERAL REQUIREMENTS

- All features must be configurable per company
- UI should be simple and intuitive
- Only enabled features should appear in the customer-facing widget
- Data should be stored per company