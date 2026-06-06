# Grain Conference Intelligence Tool

A sales intelligence tool for Grain FX that helps reps manage conference attendance, capture leads in the field, track repeat contacts across events, and push leads into HubSpot.

---

## Features

- **Conference browser** — scored and tiered list of fintech, payments, FX, and travel conferences with ICP fit scores
- **Attendance planner** — mark which conferences to attend and assign reps
- **Field Capture** — mobile-optimised form for logging contacts on the floor; two modes: rep types it in, or the lead fills in their own details
- **Leads list** — all captured leads with intent signals (hot/warm/cold), tags, and filters; expand any row to push directly to HubSpot
- **Repeat contact tracking** — automatically recognises when the same person is encountered at multiple conferences (fuzzy name matching + email dedup); surfaces only those contacts in the Contacts tab
- **AI Relationship Arc** — for repeat contacts, generates a 2–3 sentence arc: intent trajectory, verdict (worth pursuing or tire-kicker), and a concrete next action — powered by Groq (free tier)
- **HubSpot sync** — push individual leads to HubSpot CRM as contacts with one click

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free cluster
- A [Groq](https://console.groq.com/) API key (free, no credit card)
- A [HubSpot](https://www.hubspot.com/) free account with a Private App token (optional — only needed for CRM sync)

---

## Setup

**1. Install dependencies**

```bash
npm run install:all
```

This installs packages for both the client and server in one command.

**2. Configure environment variables**

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your keys (see [API Keys](#api-keys) below).

**3. Start the app**

```bash
npm start
```

This boots the backend (port 5000) and the frontend (port 5173) together.  
Open [http://localhost:5173](http://localhost:5173) in your browser.

**4. Seed conference data**

Go to **Settings** → click **"Seed 30 Conferences"** to populate the database with pre-scored conferences.

---

## API Keys

### MongoDB URI
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier)
2. Create a cluster → click **Connect** → **Drivers**
3. Copy the connection string and replace `<password>` with your database user password

### Groq API Key (AI feature)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Go to **API Keys** → **Create API key**
3. Copy the key (starts with `gsk_...`)

### HubSpot API Key (CRM sync — optional)
1. Sign up at [hubspot.com](https://www.hubspot.com) (free CRM)
2. Go to **Settings** → **Integrations** → **Private Apps**
3. Click **Create a private app** → add the `crm.objects.contacts.write` scope
4. Copy the token (starts with `pat-...`)

---

## Using the App

### Capturing a lead at a conference
1. Open **Field Capture** on your phone
2. Choose **"I'll type it"** (rep enters details) or **"Pass to lead"** (hand the phone to the contact)
3. Select the conference, fill in the contact's details, set intent and tags
4. Hit **Capture Lead** — the contact is saved instantly

### Reviewing leads after an event
- Go to **Leads** to see everyone captured, filterable by intent and conference
- Expand a row to see full details and push to HubSpot
- If a lead has been seen before, a **"View profile →"** link appears

### Tracking repeat contacts
- Go to **Leads → Repeat Contacts tab** to see only people encountered at 2+ conferences
- Each card shows encounter history and intent signals across events
- Click **"Generate arc"** to get an AI-written relationship summary and next-move recommendation

### Planning conference attendance
- Go to **Conferences** to browse all events with ICP scores and tier ratings
- Toggle **"Attending"** on any conference to add it to your plan
- Go to **Planner** for a focused view of your upcoming schedule

---

## Project Structure

```
/
├── client/          # React + Vite frontend
│   └── src/
│       ├── pages/   # One file per page
│       ├── components/
│       ├── api.ts   # Axios client
│       └── types.ts # Shared TypeScript types
├── server/          # Express + Node.js backend
│   └── src/
│       ├── routes/  # API endpoints
│       ├── models/  # Mongoose models
│       └── lib/     # Contact matching logic, scoring
└── package.json     # Root — run scripts from here
```
