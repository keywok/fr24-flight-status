# FR24 Flight Status

A small Chrome extension for Flightradar24's aircraft history pages
(`flightradar24.com/data/aircraft/<registration>`). The redesigned page often leaves the Status column empty, or shows
"Estimated" for a flight that has already landed. This extension asks FR24's flight list for the aircraft once per
page view and writes that answer into the Status column:

- an empty Status cell gets the flight's status, such as "Scheduled", "Landed 14:46" or "Unknown";
- a pill whose status differs from FR24's flight list is replaced; one that agrees is left alone.

Every status pill is coloured by its status:

| Status | Pill |
|---|---|
| Scheduled | solid blue |
| Landed | green |
| Estimated, Delayed | orange |
| Diverted, Canceled | red |
| Unknown | grey |

## Install

1. On this page, click **Code**, then **Download ZIP**, and unzip it somewhere it can stay.
2. In Chrome, open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the unzipped folder (the one holding `manifest.json`).
4. Open or reload any aircraft page on Flightradar24.

To update, replace the folder's files with the new ones and click the reload arrow on the extension's card.

## Limits

- The call is anonymous, so FR24 answers the last 7 days of flights; older rows keep the page's own status.
- Only the aircraft's newest 100 flights are asked for.
- Flights that have not flown yet often have no flight id, so they keep the page's own status.
- The narrow (phone-width) layout is left as it is.
- It relies on an undocumented FR24 endpoint and on the page's layout; either can change and stop it working.

Not affiliated with Flightradar24.
