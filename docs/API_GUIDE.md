# SlotMatch API Guide

A complete guide to using the SlotMatch API to query candidate availability programmatically.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Creating an API Key](#creating-an-api-key)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
   - [Get All Candidates' Availability](#get-all-candidates-availability)
   - [Get Availability by Email](#get-availability-by-email)
   - [Get Availability by Candidate ID](#get-availability-by-candidate-id)
6. [Response Format](#response-format)
7. [Timezones & Availability Windows](#timezones--availability-windows)
8. [Rate Limiting & CORS](#rate-limiting--cors)
9. [Error Handling](#error-handling)
10. [Managing API Keys](#managing-api-keys)
11. [Integration Examples](#integration-examples)
    - [cURL](#curl)
    - [JavaScript / Node.js](#javascript--nodejs)
    - [Python](#python)
12. [Finding Overlapping Slots](#finding-overlapping-slots)
13. [Security Best Practices](#security-best-practices)

---

## Overview

The SlotMatch API allows you to programmatically fetch candidate availability data. This is useful for:

- **AI scheduling agents** that need to find interview times automatically
- **Calendar integrations** that sync availability into tools like Google Calendar
- **Custom dashboards** that display candidate data in your own systems
- **Automation scripts** that process availability data in bulk

The API uses **Bearer token authentication** with API keys that you generate from the SlotMatch admin dashboard.

---

## Getting Started

Before using the API, you need:

1. A running SlotMatch instance (e.g., `https://your-app.up.railway.app`)
2. An admin account to log into the dashboard
3. At least one API key (created from the dashboard)

---

## Creating an API Key

### Step 1: Log in to the Admin Dashboard

Navigate to your SlotMatch instance and log in with your admin credentials.

### Step 2: Go to the API Keys Page

In the sidebar, click **API Keys**.

### Step 3: Create a New Key

1. Click the **Create API Key** button
2. Enter a descriptive name (e.g., "Scheduling Bot", "Calendar Sync")
3. Click **Create**

### Step 4: Copy Your Key

After creation, your API key will be displayed **once**. It looks like this:

```
sm_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

> **IMPORTANT:** Copy and save your API key immediately. It will never be shown again. If you lose it, you'll need to create a new one.

The key is prefixed with `sm_` followed by a random string. In the dashboard, you'll only see the prefix (e.g., `sm_a1b2c3d4...`) for identification purposes.

---

## Authentication

All API requests require a valid API key passed in the `Authorization` header using the **Bearer** scheme:

```
Authorization: Bearer sm_your_api_key_here
```

### Example Header

```http
GET /api/external/availability HTTP/1.1
Host: your-app.up.railway.app
Authorization: Bearer sm_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## API Endpoints

### Base URL

```
https://your-app.up.railway.app
```

Replace `your-app.up.railway.app` with your actual SlotMatch domain.

---

### Get All Candidates' Availability

Fetch the latest submitted availability for all candidates.

**Request:**

```
GET /api/external/availability
```

**cURL Example:**

```bash
curl -X GET "https://your-app.up.railway.app/api/external/availability" \
  -H "Authorization: Bearer sm_your_api_key_here"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "candidateId": "clx1abc2d0001...",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "availability": {
        "windowStart": "2026-03-30T00:00:00.000Z",
        "windowEnd": "2026-04-12T23:59:59.999Z",
        "submittedAt": "2026-03-31T14:30:00.000Z",
        "slots": [
          {
            "date": "2026-03-30",
            "startTime": "09:00",
            "endTime": "12:00"
          },
          {
            "date": "2026-03-30",
            "startTime": "14:00",
            "endTime": "17:00"
          },
          {
            "date": "2026-03-31",
            "startTime": "10:00",
            "endTime": "16:00"
          }
        ]
      }
    },
    {
      "candidateId": "clx1def5g0002...",
      "email": "john@example.com",
      "name": "John Doe",
      "availability": null
    }
  ]
}
```

> **Note:** If a candidate hasn't submitted their availability yet, the `availability` field will be `null`.

---

### Get Availability by Email

Fetch availability for a specific candidate using their email address.

**Request:**

```
GET /api/external/availability?email=jane@example.com
```

**cURL Example:**

```bash
curl -X GET "https://your-app.up.railway.app/api/external/availability?email=jane@example.com" \
  -H "Authorization: Bearer sm_your_api_key_here"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "candidateId": "clx1abc2d0001...",
      "email": "jane@example.com",
      "name": "Jane Smith",
      "availability": {
        "windowStart": "2026-03-30T00:00:00.000Z",
        "windowEnd": "2026-04-12T23:59:59.999Z",
        "submittedAt": "2026-03-31T14:30:00.000Z",
        "slots": [
          {
            "date": "2026-03-30",
            "startTime": "09:00",
            "endTime": "12:00"
          },
          {
            "date": "2026-03-30",
            "startTime": "14:00",
            "endTime": "17:00"
          }
        ]
      }
    }
  ]
}
```

---

### Get Availability by Candidate ID

Fetch availability for a specific candidate using their internal ID.

**Request:**

```
GET /api/external/availability?candidateId=clx1abc2d0001...
```

**cURL Example:**

```bash
curl -X GET "https://your-app.up.railway.app/api/external/availability?candidateId=clx1abc2d0001" \
  -H "Authorization: Bearer sm_your_api_key_here"
```

---

## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": [ ... ]
}
```

### Error Response

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

### Candidate Object

| Field | Type | Description |
|-------|------|-------------|
| `candidateId` | `string` | Unique identifier for the candidate |
| `email` | `string` | Candidate's email address |
| `name` | `string \| null` | Candidate's name (may be null) |
| `availability` | `object \| null` | Latest submitted availability, or null if not yet submitted |

### Availability Object

| Field | Type | Description |
|-------|------|-------------|
| `windowStart` | `string` (ISO 8601) | Start of the 2-week availability window |
| `windowEnd` | `string` (ISO 8601) | End of the 2-week availability window |
| `submittedAt` | `string` (ISO 8601) | When the candidate submitted their availability |
| `slots` | `array` | List of available time slots |

### Time Slot Object

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` (YYYY-MM-DD) | The date of the time slot |
| `startTime` | `string` (HH:MM) | Start time in 24-hour format |
| `endTime` | `string` (HH:MM) | End time in 24-hour format |

---

## Timezones & Availability Windows

### Timezone

All `startTime` and `endTime` values in time slots are in the **server's local timezone**. The `windowStart` and `windowEnd` fields are ISO 8601 UTC timestamps. When scheduling interviews, convert slot times to the appropriate timezone for your use case.

### Availability Window Lifecycle

Each availability window goes through the following states:

| Status | Description |
|--------|-------------|
| `OPEN` | Window is created when a candidate is added or a new cycle starts. Candidate has not yet submitted. |
| `SUBMITTED` | Candidate has submitted their availability. This is the data returned by the API. |
| `EXPIRED` | Window period has passed without a submission. No data available for this cycle. |

**Key points:**

- Windows follow a **2-week rolling cycle** (Monday to Sunday of the following week)
- The API always returns only the **latest submitted** window for each candidate
- A new window is created automatically at the start of each cycle
- Candidates must provide a minimum of 20 hours of availability per week

---

## Rate Limiting & CORS

### Rate Limits

There are currently **no rate limits** on the API. However, availability data only changes when candidates submit (typically once per 2-week cycle), so frequent polling is unnecessary.

**Recommended polling interval:** Every 5–15 minutes at most.

### CORS

> **Important:** The API does **not** set CORS headers. It is a **server-to-server API** and cannot be called directly from browser-based JavaScript. Always make API calls from your backend server.

---

## Error Handling

| HTTP Status | Error Message | Meaning |
|-------------|---------------|---------|
| `401` | `Missing API key. Use Bearer token.` | No `Authorization` header provided |
| `401` | `Invalid or revoked API key` | The API key is wrong, expired, or has been revoked |
| `403` | `Insufficient permissions` | The API key doesn't have the `read:availability` scope |

### Handling Errors in Code

Always check the `success` field in the response:

```javascript
const response = await fetch(url, { headers });
const data = await response.json();

if (!data.success) {
  console.error("API Error:", data.error);
  return;
}

// Safe to use data.data here
```

---

## Managing API Keys

### Viewing Your Keys

Go to **API Keys** in the sidebar to see all your keys. Each key shows:

- **Name** — The label you gave it
- **Prefix** — First few characters for identification (e.g., `sm_a1b2...`)
- **Created** — When the key was created
- **Last Used** — When the key was last used to make an API call
- **Status** — Active or Revoked

### Revoking a Key

If a key is compromised or no longer needed:

1. Go to **API Keys** in the sidebar
2. Click **Revoke** next to the key
3. The key will immediately stop working

Revoked keys remain visible in the list (marked as "Revoked") for audit purposes.

### Deleting a Key

To permanently remove a key from the system:

1. Go to **API Keys** in the sidebar
2. Click **Delete** next to the key
3. Confirm the deletion

This action is irreversible.

---

## Integration Examples

### cURL

```bash
# Fetch all candidates' availability
curl -s "https://your-app.up.railway.app/api/external/availability" \
  -H "Authorization: Bearer sm_your_api_key_here" | jq .

# Fetch by email
curl -s "https://your-app.up.railway.app/api/external/availability?email=jane@example.com" \
  -H "Authorization: Bearer sm_your_api_key_here" | jq .
```

### JavaScript / Node.js

```javascript
const API_URL = "https://your-app.up.railway.app";
const API_KEY = "sm_your_api_key_here";

async function getAvailability(email) {
  const url = email
    ? `${API_URL}/api/external/availability?email=${encodeURIComponent(email)}`
    : `${API_URL}/api/external/availability`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.data;
}

// Usage
const candidates = await getAvailability();
console.log(`Found ${candidates.length} candidates`);

for (const candidate of candidates) {
  if (candidate.availability) {
    console.log(`${candidate.name}: ${candidate.availability.slots.length} time slots`);
  } else {
    console.log(`${candidate.name}: No availability submitted yet`);
  }
}
```

### Python

```python
import requests

API_URL = "https://your-app.up.railway.app"
API_KEY = "sm_your_api_key_here"

def get_availability(email=None):
    """Fetch candidate availability from SlotMatch."""
    url = f"{API_URL}/api/external/availability"
    params = {}
    if email:
        params["email"] = email

    response = requests.get(
        url,
        headers={"Authorization": f"Bearer {API_KEY}"},
        params=params,
    )
    data = response.json()

    if not data["success"]:
        raise Exception(data["error"])

    return data["data"]


# Usage
candidates = get_availability()
print(f"Found {len(candidates)} candidates")

for c in candidates:
    if c["availability"]:
        slots = c["availability"]["slots"]
        print(f"  {c['name']}: {len(slots)} time slots available")
        for slot in slots:
            print(f"    {slot['date']} {slot['startTime']}-{slot['endTime']}")
    else:
        print(f"  {c['name']}: No availability yet")
```

---

## Finding Overlapping Slots

The most common use case is finding times when multiple candidates are all available for an interview. Here's how to compute overlapping availability:

```javascript
// Find time slots where ALL specified candidates are available
async function findOverlappingSlots(candidateEmails) {
  const API_URL = "https://your-app.up.railway.app";
  const API_KEY = "sm_your_api_key_here";

  // Fetch availability for all candidates
  const results = await Promise.all(
    candidateEmails.map(async (email) => {
      const res = await fetch(
        `${API_URL}/api/external/availability?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );
      const data = await res.json();
      return data.data[0];
    })
  );

  // Filter to candidates who have submitted
  const withAvailability = results.filter((r) => r?.availability);
  if (withAvailability.length !== candidateEmails.length) {
    console.log("Not all candidates have submitted availability yet.");
    return [];
  }

  // Build a map of date -> array of slots per candidate
  const dateMap = new Map();
  for (const candidate of withAvailability) {
    for (const slot of candidate.availability.slots) {
      if (!dateMap.has(slot.date)) dateMap.set(slot.date, []);
      dateMap.get(slot.date).push({
        candidate: candidate.email,
        start: slot.startTime,
        end: slot.endTime,
      });
    }
  }

  // Find dates where all candidates have overlapping time
  const overlaps = [];
  for (const [date, slots] of dateMap) {
    // Group by candidate
    const byCand = {};
    for (const s of slots) {
      if (!byCand[s.candidate]) byCand[s.candidate] = [];
      byCand[s.candidate].push(s);
    }

    // All candidates must have slots on this date
    if (Object.keys(byCand).length < candidateEmails.length) continue;

    // Check each 30-min block
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 30) {
        const blockStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        const blockEnd =
          m === 30
            ? `${String(h + 1).padStart(2, "0")}:00`
            : `${String(h).padStart(2, "0")}:30`;

        const allAvailable = candidateEmails.every((email) =>
          byCand[email]?.some((s) => s.start <= blockStart && s.end >= blockEnd)
        );

        if (allAvailable) {
          overlaps.push({ date, time: blockStart });
        }
      }
    }
  }

  return overlaps;
}

// Usage
const slots = await findOverlappingSlots([
  "jane@example.com",
  "john@example.com",
]);
console.log("Common availability:", slots);
// Output: [{ date: "2026-04-01", time: "10:00" }, { date: "2026-04-01", time: "10:30" }, ...]
```

---

## Security Best Practices

1. **Never expose your API key in client-side code** (browsers, mobile apps). Always call the API from a backend server.

2. **Store keys in environment variables**, not in source code:
   ```bash
   export SLOTMATCH_API_KEY="sm_your_api_key_here"
   ```

3. **Use descriptive names** when creating keys so you know which integration each key belongs to.

4. **Revoke keys immediately** if they are compromised or no longer needed.

5. **Create separate keys** for different integrations. This way, if one is compromised, you only need to rotate that one key.

6. **Monitor usage** by checking the "Last Used" timestamp in the dashboard to identify unused or suspicious keys.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Base URL** | `https://your-app.up.railway.app` |
| **Auth Header** | `Authorization: Bearer sm_...` |
| **Endpoint** | `GET /api/external/availability` |
| **Filters** | `?email=...` or `?candidateId=...` |
| **Key Prefix** | `sm_` |
| **Required Scope** | `read:availability` |

---

*Generated for SlotMatch. For questions or issues, contact your system administrator.*
