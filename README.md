# ✈️ Air Price Index (APIx)

### Real-Time Airfare Price Index for India

**Smart India Hackathon 2026 · Problem Statement: SIH26056**

> **Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI).**

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [SIH Problem Statement](#-sih-problem-statement)
- [Why This Problem Matters](#-why-this-problem-matters)
- [Our Proposed Solution](#-our-proposed-solution)
- [Core Objectives](#-core-objectives)
- [End-to-End System Flow](#-end-to-end-system-flow)
- [System Architecture](#-system-architecture)
- [Data Collection](#-data-collection-layer)
- [Data Cleaning and Normalization](#-data-cleaning-and-normalization)
- [Database Layer](#-database-layer)
- [Airfare Price Index](#-airfare-price-index-engine)
- [Backend and REST APIs](#-backend-and-rest-apis)
- [Frontend Dashboard](#-frontend-dashboard)
- [PDF Reports](#-reports-and-pdf-generation)
- [Automation](#-automation-and-scheduling)
- [Deployment](#-deployment)
- [Technology Stack](#-technology-stack)
- [Data Quality](#-data-quality-and-reliability)
- [Responsible Data Collection](#-ethical-and-responsible-data-collection)
- [Team](#-project-team)
- [Individual Contributions](#-individual-contributions)
- [Learning Outcomes](#-learning-outcomes)
- [Local Setup](#-local-setup)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Future Scope](#-future-scope)
- [Limitations](#-limitations-and-important-notes)
- [References](#-research-and-references)

---

# 📊 Project Overview

**Air Price Index (APIx)** is a software platform developed for **Smart India Hackathon 2026 Problem Statement SIH26056**.

The project focuses on building an automated workflow for collecting airfare observations, cleaning and standardizing those observations, storing them systematically, calculating an airfare price index, exposing processed information through APIs, and presenting the results through an interactive web dashboard.

The central workflow is:

```text
Airfare Sources
      ↓
Automated Collection
      ↓
Raw Fare Data
      ↓
Cleaning & Normalization
      ↓
Database
      ↓
Index Calculation
      ↓
REST APIs
      ↓
Interactive Dashboard
      ↓
Analytics & Reports
```

APIx is therefore designed as a **complete data pipeline**, rather than simply a flight-search or price-comparison website.

---

# 🏛️ SIH Problem Statement

## Problem Statement ID

**SIH26056**

## Organization

**Ministry of Statistics and Programme Implementation (MoSPI)**

## Division

**Data Informatics & Innovation Division (DIID)**

## Category

**Software**

## Theme

**Travel & Tourism**

## Problem Statement

> Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI).

The SIH problem statement identifies the need for an automated and scalable system capable of collecting airfare information from airline websites and Online Travel Aggregators, cleaning and normalizing the collected observations, and computing a real-time airfare price index.

### Official / Reference Source

https://sih.gov.in/sih2026PS

---

# ❗ Why This Problem Matters

Airfares are dynamic rather than static.

The fare available to a traveller can change depending on several factors, including:

- Route
- Airline
- Departure date
- Advance booking period
- Day of week
- Demand
- Seasonal conditions
- Availability
- Fare inventory
- Taxes and charges
- Other market conditions

The SIH problem statement specifically points toward the requirement for automated, scalable and high-frequency airfare data collection.

The basic difference can be represented as:

```text
Traditional / Occasional Observation
                ↓
        Limited Price Sample
                ↓
       Limited Price Visibility
```

versus:

```text
Automated High-Frequency Collection
                ↓
        Larger Observation Set
                ↓
       Historical Price Movement
                ↓
         Price Index Analytics
```

---

# 💡 Our Proposed Solution

APIx combines several components into one integrated platform.

### 1. Automated Fare Collection

A collection layer retrieves airfare observations from supported airline and OTA sources.

Development initially focused on **Cleartrip** as the primary scraping source.

### 2. Data Processing

Raw observations are cleaned, validated and converted into a consistent structure.

### 3. Database Storage

Processed observations are stored so that historical fare information can be queried and analyzed.

### 4. Index Calculation

Fare observations are converted into index values relative to a selected base period and methodology.

### 5. REST API

The processed data is exposed through API endpoints.

### 6. Interactive Dashboard

The frontend presents:

- Price information
- Route-level data
- Search functionality
- Analytics
- Charts
- Historical information
- Project documentation

### 7. Report Generation

The platform can transform analytical information into structured reports/PDF outputs.

---

# 🎯 Core Objectives

The project aims to:

- Automate airfare data collection.
- Reduce dependency on manual price observation.
- Capture airfare changes over time.
- Normalize heterogeneous fare records.
- Maintain historical observations.
- Provide route-level analytics.
- Calculate a reproducible airfare price index.
- Provide API-based access to processed data.
- Present the results through an accessible dashboard.
- Support structured report generation.
- Build an architecture that can be automated and scaled.
- Maintain traceability between observations and analytical results.

---

# 🔄 End-to-End System Flow

```text
┌──────────────────────────────┐
│ Airline / OTA Fare Sources  │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Automated Scraping /         │
│ Collection Layer             │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Raw Fare Observations        │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Validation                   │
│ Cleaning                     │
│ Normalization                │
│ Deduplication                │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Database                     │
│ Historical Fare Records      │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Price Index Engine            │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ REST API                     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Next.js Dashboard            │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│ Analytics / Charts / Reports │
└──────────────────────────────┘
```

---

# 🏗️ System Architecture

The application is divided into logical layers.

## Layer 1 — Data Collection

Responsible for:

- Accessing supported fare sources.
- Searching specified routes.
- Collecting flight/fare observations.
- Capturing relevant metadata.
- Recording collection timestamps.

## Layer 2 — Data Processing

Responsible for:

- Cleaning raw records.
- Standardizing fields.
- Handling missing values.
- Validating prices.
- Removing duplicate observations.
- Converting values into consistent formats.

## Layer 3 — Storage

Responsible for:

- Historical observations.
- Route information.
- Airport information.
- Airline information.
- Price history.
- Index-related data.

## Layer 4 — Analytics

Responsible for:

- Fare statistics.
- Route comparisons.
- Price movement.
- Index calculation.
- Historical analysis.

## Layer 5 — API

Responsible for:

- Exposing structured data.
- Connecting frontend and data-processing logic.
- Returning JSON responses.
- Providing a reusable interface for future consumers.

## Layer 6 — Presentation

Responsible for:

- Dashboard.
- Charts.
- Tables.
- Route analysis.
- Price-index visualization.
- Project documentation.
- Team information.
- Reports.

---

# 🕷️ Data Collection Layer

## Initial Scraping Implementation

The scraper was developed incrementally.

Instead of attempting to build the complete collection system in one step, individual extraction components were built and tested before integration.

The initial implementation focused on **Cleartrip**.

Conceptually:

```text
Route
  ↓
Departure Date
  ↓
Search Fare
  ↓
Load Results
  ↓
Extract Flight Information
  ↓
Extract Fare
  ↓
Create Structured Record
```

A normalized observation can contain information such as:

```text
airline
flight_number
origin
destination
departure_date
departure_time
arrival_time
fare
currency
collection_timestamp
source
```

The exact fields may evolve with the source and statistical requirements.

---

# 🧹 Data Cleaning and Normalization

Raw web data is not immediately suitable for statistical analysis.

The processing layer therefore performs several operations.

## Validation

Records can be checked for:

- Missing route information.
- Invalid prices.
- Missing dates.
- Invalid timestamps.
- Incomplete flight records.

## Normalization

Different sources can represent the same information differently.

For example:

```text
Delhi      → DEL
Mumbai     → BOM
Bengaluru  → BLR
```

The system converts these into consistent representations.

## Deduplication

Repeated records from the same collection event are identified so that duplicates do not unintentionally distort analysis.

## Price Normalization

The system works toward a consistent fare representation so that prices can be compared across observations.

## Historical Preservation

The objective is not simply to retain the latest fare.

Instead:

```text
Current Price
      ↓
Historical Prices
      ↓
Price Movement
      ↓
Index / Analytics
```

---

# 🗄️ Database Layer

The database layer provides persistent storage for processed airfare information.

The project also used local CockroachDB tooling during development. Database credentials and local infrastructure files should remain outside source control.

The database is intended to support:

- Flight records
- Fare observations
- Routes
- Airports
- Airlines
- Historical prices
- Index-related information

A conceptual observation structure is:

```text
Observation
├── source
├── airline
├── flight
├── origin
├── destination
├── departure_date
├── collection_timestamp
├── fare
└── metadata
```

Historical records make it possible to answer questions such as:

- How did fares change?
- Which routes experienced the largest changes?
- How does fare vary with booking lead time?
- How does the current index compare with the base period?

---

# 📈 Airfare Price Index Engine

The index layer converts individual fare observations into an interpretable statistical measure.

A basic base-100 price-index representation can be expressed as:

```text
Indexₜ
=
(Current comparable price measure
 / Base-period comparable price measure)
× 100
```

For example:

```text
Base period = 100

10% increase
      ↓
Index = 110
```

The final statistical methodology, route weighting and production methodology can be further refined with authoritative data and institutional validation.

A key design principle of APIx is:

> **Every published index value should be traceable back to the underlying observations used to calculate it.**

---

# 🔌 Backend and REST APIs

The current application exposes API routes including:

```text
/api/price-index
/api/route-data
/api/routes
/api/search-fares
```

## `/api/price-index`

Provides price-index related information used by the dashboard.

## `/api/route-data`

Provides route-level data used for analysis and visualization.

## `/api/routes`

Provides route information.

## `/api/search-fares`

Provides fare-search functionality.

The API layer keeps the frontend separated from the underlying data-processing logic.

---

# 🖥️ Frontend Dashboard

The web application is built using **Next.js and TypeScript**.

The dashboard brings the different components together and provides:

- Price-index information
- Fare search
- Route analytics
- Charts
- Historical analysis
- Reports
- About-project documentation
- Team information

The interface was also designed to be responsive across:

- Desktop
- Laptop
- Tablet
- Mobile

---

# 📄 Reports and PDF Generation

The report-generation component converts analytical results into structured PDF reports.

The report layer is intended to make the data useful beyond the live dashboard.

It can be used for:

- Reviewing index results
- Sharing analytical summaries
- Route-level information
- Historical comparisons
- Preserving analytical outputs
- Project demonstrations

The report is generated from application data rather than being a manually written static document.

---

# ⚙️ Automation and Scheduling

The project was designed with automation in mind.

The intended recurring workflow is:

```text
Scheduler
    ↓
Collection Job
    ↓
Scraper
    ↓
Data Cleaning
    ↓
Database Update
    ↓
Index Calculation
    ↓
API / Dashboard Update
```

The architecture can use cloud infrastructure such as **AWS EC2** together with a scheduler/job mechanism for recurring data collection.

This changes the project from:

```text
Manual execution
```

to:

```text
Scheduled automated pipeline
```

---

# ☁️ Deployment

The application has been deployed using **Vercel**.

The production workflow is:

```text
Local Development
       ↓
Git Repository
       ↓
Vercel
       ↓
Production Build
       ↓
Live Application
```

### Live Project

https://www.airpriceindex.in

---

# 📱 Responsive Design

The frontend includes responsive layouts for different screen sizes.

Responsive behavior includes:

- Desktop navigation
- Mobile navigation
- Responsive cards
- Responsive workflow sections
- Responsive team section
- Flexible dashboard layouts
- Mobile-friendly project documentation

The objective is to keep the application usable rather than simply shrinking the desktop layout.

---

# 🛠️ Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- HTML
- CSS
- Responsive UI
- Data visualization

## Backend / API

- Next.js App Router API routes
- TypeScript
- REST-style API architecture

## Data

- SQL
- Relational database concepts
- Fare observations
- Data cleaning
- Data normalization
- Historical records

## Scraping / Automation

- Automated web scraping
- Dynamic-page extraction
- Collection workflow
- Scheduled execution architecture

## Infrastructure

- AWS EC2 for automated collection infrastructure
- Vercel for web deployment
- Git
- GitHub

---

# 🔍 Data Quality and Reliability

A statistical system cannot depend only on collecting data.

It must also determine whether collected information is usable.

The processing philosophy is:

```text
Collection
   ↓
Validation
   ↓
Cleaning
   ↓
Normalization
   ↓
Deduplication
   ↓
Storage
   ↓
Analysis
```

 quality checks include:

- Missing values
- Invalid prices
- Invalid dates
- Duplicate observations
- Unavailable flights
- Inconsistent route codes
- Timestamp consistency
- Source identification

The system should retain sufficient metadata to understand **where and when** an observation was collected.

---

# 🛡️ Ethical and Responsible Data Collection

Automated collection must respect the rules and restrictions associated with each source.

The collection layer is designed as an independent component so that source connectors can be replaced or extended without redesigning the entire statistical pipeline.

Responsible collection considerations include:

- Source terms of service
- `robots.txt`
- Rate limiting
- Anti-bot safeguards
- Session management
- Appropriate request frequency
- Respect for source restrictions

---

# 🔐 Configuration and Secrets

Sensitive information should **never** be committed to GitHub.

Examples include:

```text
DATABASE_URL
API_KEYS
AUTHENTICATION_SECRETS
CLOUD_CREDENTIALS
```

Use:

```text
.env.local
```

for local configuration and keep secret files excluded through `.gitignore`.

---

# 📁 Project Structure

```text
airpriceindex/
│
├── app/
│   ├── api/
│   │   ├── price-index/
│   │   ├── route-data/
│   │   ├── routes/
│   │   └── search-fares/
│   │
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── favicon.ico
│
├── public/
│   ├── logo.png
│   └── team/
│       ├── aman.jpeg
│       ├── ashish.jpeg
│       ├── satyam.jpeg
│       ├── shivam.jpeg
│       ├── souhali.jpeg
│       └── vineet.jpeg
│
├── import-flight-data.mjs
├── package.json
├── package-lock.json
└── README.md
```

---

# 🚀 Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/ashish-accesss/airpriceindexx.git
cd airpriceindexx
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create:

```text
.env.local
```

and add the required local database/API configuration.

Never commit secrets to GitHub.

## 4. Run development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Production build

```bash
npm run build
```

## 6. Production server

```bash
npm start
```

---

# 🔌 API Reference

### Price Index

```http
GET /api/price-index
```

Price-index related information.

### Route Data

```http
GET /api/route-data
```

Route-level data for analytics.

### Routes

```http
GET /api/routes
```

Available route information.

### Search Fares

```http
GET /api/search-fares
```

Fare-search functionality.

> API response fields may evolve as the project and statistical methodology are refined.

---

# 🧪 Development Philosophy

The project was built incrementally.

Instead of implementing everything simultaneously:

```text
Component
   ↓
Test
   ↓
Validate
   ↓
Integrate
   ↓
Next Component
```

This approach was particularly  for the scraping system.

Individual extraction steps were tested before being integrated into the larger workflow.

The same development philosophy was used for:

- Scraping
- Data processing
- Database operations
- APIs
- Frontend
- Reports
- Deployment

---

# 📈 Scalability

The architecture allows additional source connectors to be added without redesigning the entire system.

```text
Cleartrip Connector ─┐
Airline Connector ───┤
OTA Connector ───────┤
Future Source ───────┘
          ↓
 Common Normalization
          ↓
      Database
          ↓
     Index Engine
          ↓
       REST API
          ↓
      Dashboard
```

This separation makes the system easier to maintain and expand.

---

# 🔮 Future Scope

## More Source Connectors

Extend the collection layer to additional permitted airline and OTA sources.

## Higher-Frequency Collection

Increase collection frequency where infrastructure and source policies permit.

## Expanded Route Coverage

Expand the representative route basket using appropriate authoritative traffic data.

## Improved Statistical Weighting

Integrate authoritative passenger-volume information where available.

## Advanced Analytics

Potential extensions include:

- Fare volatility
- Route-level inflation
- Airline comparisons
- Booking-window analysis
- Seasonal analysis
- Historical trend analysis

## Production Automation

Deploy a fully scheduled cloud collection pipeline using:

```text
Scheduler
   ↓
Workers
   ↓
Collection
   ↓
Processing
   ↓
Database
   ↓
Index
```

## Institutional Integration

Expose standardized outputs suitable for integration into statistical systems, subject to methodology validation, institutional review and source permissions.

---

# ⚠️ Limitations and  Notes

This repository represents a **working SIH project/prototype implementation**.

A production-grade national statistical system would require additional:

- Statistical validation
- Institutional review
- Authoritative weighting data
- Source agreements/permissions
- Methodology approval
- Long-term monitoring
- Revision and audit procedures

Therefore, APIx should be understood as a technical implementation demonstrating the complete pipeline:

```text
Data Collection
      +
Data Engineering
      +
Statistics
      +
Database
      +
API
      +
Visualization
      +
Reporting
```

It should not be interpreted as an official replacement for the Government of India's CPI methodology.

---

# 👥 Project Team

## Team Members

| Photo | Name | Role |
|---|---|---|
| <img src="public/team/souhali.jpeg" width="90"/> | **Souhali Reang** | Team Leader · Graphic Designer & Documentation |
| <img src="public/team/ashish.jpeg" width="90"/> | **Ashish** | Web Scraping · Automation · Statistics · SQL · Backend & Research |
| <img src="public/team/aman.jpeg" width="90"/> | **Aman Raj** | Frontend UI · Research · Testing & Documentation |
| <img src="public/team/shivam.jpeg" width="90"/> | **Shivam Singh** | Research & Methodology · Statistics |
| <img src="public/team/vineet.jpeg" width="90"/> | **Vineet Lunthi** | Full Stack Developer & Optimization |
| <img src="public/team/satyam.jpeg" width="90"/> | **Satyam Singh** | Data & Database · SQL & Designing |


---

# 👤 Individual Contributions

## 1. Souhali Reang

**Team Leader · Graphic Designer & Documentation**

- Team leadership
- Team coordination
- Graphic design
- Presentation design
- Documentation
- Project communication

GitHub:  
https://github.com/souhalireang-ai

LinkedIn:  
https://www.linkedin.com/in/souhali-reang-652197385/

---

## 2. Ashish

**Web Scraping · Automation · Statistics · SQL · Backend & Research**

- Web scraping
- Automated collection
- Automation architecture
- Statistical analysis
- SQL
- Backend/API development
- Research
- System integration

GitHub:  
https://github.com/ashish-accesss

LinkedIn:  
https://www.linkedin.com/in/ashish-access/

---

## 3. Aman Raj

**Frontend UI · Research · Testing & Documentation**

- Frontend UI
- Responsive design
- Research
- Testing
- Documentation
- UI validation

GitHub:  
https://github.com/LexusR27

LinkedIn:  
https://www.linkedin.com/in/aman-raj-a90158381/

---

## 4. Shivam Singh

**Research & Methodology · Statistics**

- Research
- Statistical methodology
- Index-related analysis
- Analytical interpretation
- Methodological validation

GitHub:  
https://github.com/shivamgov13-pixel

LinkedIn:  
https://www.linkedin.com/in/shivam-singh-a84592381/

---

## 5. Vineet Lunthi

**Full Stack Developer & Optimization**

- Full-stack development
- Application integration
- Optimization
- Performance improvements
- Frontend/backend integration

GitHub:  
https://github.com/vineet1513

LinkedIn:  
https://www.linkedin.com/in/vineetlunthi/

---

## 6. Satyam Singh

**Data & Database · SQL & Designing**

- Data management
- Database design
- SQL
- Data organization
- Database-driven features
- Design support

GitHub:  
https://github.com/satyamsingh134

LinkedIn:  
https://www.linkedin.com/in/satyam-singh-922799391

---

# 🧠 Learning Outcomes

### Souhali Reang

- Team coordination
- Graphic design
- Technical documentation
- Visual presentation of technical work

### Ashish

- Web scraping
- Automation
- Backend development
- SQL
- Statistics
- REST APIs
- System integration

### Aman Raj

- Next.js/React frontend development
- Responsive UI
- Testing
- Documentation
- Research

### Shivam Singh

- Statistical methodology
- Research
- Price-index concepts
- Analytical interpretation

### Vineet Lunthi

- Full-stack development
- System integration
- Optimization
- Application architecture

### Satyam Singh

- Database design
- SQL
- Data management
- System organization

---

# 🤝 Team Workflow

```text
                 PROJECT LEAD
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
    Research        Data          Design
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                 Web Scraping
                      ↓
                Data Cleaning
                      ↓
                  Database
                      ↓
               Statistics
                      ↓
                Backend/API
                      ↓
                Frontend UI
                      ↓
                 Testing
                      ↓
               Documentation
                      ↓
                Deployment
```

The six members worked across these interconnected stages rather than treating each component as an isolated project.

---

# 📚 Research and References

## SIH26056

**Ministry of Statistics and Programme Implementation (MoSPI)**

https://sih.gov.in/sih2026PS

## MoSPI eSankhyiki

https://esankhyiki.mospi.gov.in

## Project Website

https://www.airpriceindex.in

## GitHub Repository

https://github.com/ashish-accesss/airpriceindexx

---

# 🏆 Smart India Hackathon 2026

```text
Problem Statement ID : SIH26056
Organization         : MoSPI
Division             : Data Informatics & Innovation Division
Category             : Software
Theme                : Travel & Tourism
```

The project addresses the core challenge of converting highly dynamic airfare observations into a structured, reproducible and accessible price-index workflow.

---

# ❤️ Acknowledgement

We acknowledge the **Ministry of Statistics and Programme Implementation (MoSPI)** for the problem statement and statistical context that motivated this project.

We also acknowledge **Smart India Hackathon 2026** for providing an opportunity to work on a real-world national-level problem and develop a technology-driven solution.

---

# ✈️ Air Price Index — APIx

### From dynamic airfare data → to structured statistical intelligence.

**Built with research, data engineering, statistics, software development, design and teamwork for Smart India Hackathon 2026.**
