# PTT IP Local APK Design

## Goal

Build a local Android APK that lets the user search a PTT username and inspect public activity records, source IPs, and possible shared-IP relationships with other PTT usernames.

The first version will not use GitHub, a hosted backend, cloud SQL, scheduled crawlers, or a prebuilt global PTT index. It will run as a local Android app and query public web sources only when the user searches.

## Non-Goals

- Do not attempt to access PTT internal login records or private data.
- Do not claim that shared IP means the same person.
- Do not build a full historical index of all PTT users in the first version.
- Do not depend on GitHub Actions or any scheduled cloud crawler.
- Do not require the user to write SQL.

## User Flow

1. User opens the APK.
2. User enters a PTT ID.
3. App searches public PTT-accessible sources for posts and replies related to that ID.
4. App extracts visible metadata: board, title, date, author, reply user, reply text, and public source IP when available.
5. App displays:
   - User profile summary
   - Post records
   - Reply / push records
   - Source IP list
   - Shared-IP related usernames found from the fetched data
6. App may save fetched results locally so repeated checks on the same ID do not need a full refetch.

## Architecture

The app will use a local-first architecture:

- Android UI: search screen, result tabs, shared-IP view.
- Fetch layer: retrieves public PTT pages or public mirror/search pages.
- Parser layer: converts fetched HTML/text into structured records.
- Analysis layer: builds ID-to-IP and IP-to-ID relationships from available data.
- Local cache: stores recent searches and parsed records on the device.

The local cache can use Room/SQLite internally, but the user will not interact with SQL. The app code owns all queries and schema setup.

## Data Model

Core records:

- UserId: PTT username.
- PostRecord: board, article id/url, title, author, date, source IP when present.
- ReplyRecord: board, article id/url, reply user, reply type, content, date/time if available.
- IpRecord: IP, country hint if available, first seen date, last seen date, source article.
- SharedIpLink: target user, shared IP, evidence count, evidence article list.

## Shared-IP Analysis

The app will treat shared IP as an investigation signal, not proof of multi-account ownership.

The shared-IP view should show:

- IP address
- Other usernames observed on that IP
- Number of matching records
- Date range
- Evidence links
- A warning that shared IP can come from mobile networks, schools, companies, VPNs, public Wi-Fi, or NAT.

## Performance Expectations

Because this version does not use a prebuilt global index, first-time searches may be slow.

Performance will improve by:

- Fetching pages concurrently with limits.
- Showing partial results while more data loads.
- Caching parsed records locally.
- Letting the user stop long searches.
- Allowing board/date limits to reduce crawl size.

## Error Handling

The app should handle:

- Network failures.
- PTT rate limits or blocked pages.
- Missing or changed page structure.
- No results found.
- Records with no visible source IP.

Errors should be shown as normal UI states, not crashes.

## Testing

Initial tests should cover:

- HTML parser fixtures.
- IP extraction cases.
- Username extraction cases.
- Shared-IP relationship generation.
- Empty result and malformed page behavior.

Manual APK testing should verify:

- Search by ID.
- Tabs render correctly.
- Long searches can be cancelled.
- Cached searches reload.
- Shared-IP evidence links open or display source details.

## First Implementation Scope

The first build should prioritize a working vertical slice:

1. Android project scaffold.
2. Search screen.
3. One fetch source.
4. Parser for posts and visible source IPs.
5. Result display for post records and IP list.
6. Simple local cache.

Push/reply records and richer shared-IP expansion can follow after the first vertical slice works.
