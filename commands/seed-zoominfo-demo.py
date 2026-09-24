#!/usr/bin/env python3
"""Seed the ZoomInfo knowledge-base demo corpus.

Creates, in dependency order: assets -> reusable components -> navigation ->
20 articles. Every entry has a stable id, so re-running updates in place.
"""
import json
import os
import time
import urllib.error
import urllib.request

SPACE = os.environ["NEXT_PUBLIC_CF_SPACE"]
ENV = os.environ["NEXT_PUBLIC_CF_ENVIRONMENT"]
TOKEN = os.environ["NEXT_CF_MANAGEMENT_TOKEN"]
BASE = f"https://api.contentful.com/spaces/{SPACE}/environments/{ENV}"
UPLOAD = f"https://upload.contentful.com/spaces/{SPACE}"
L = "en-US"
HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")


# --- CMA plumbing ------------------------------------------------------------

def call(method, url, body=None, version=None, content_type=None, raw=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    if raw is not None:
        req.add_header("Content-Type", "application/octet-stream")
        req.data = raw
    elif body is not None:
        req.add_header("Content-Type", "application/vnd.contentful.management.v1+json")
        req.data = json.dumps(body).encode()
    if version is not None:
        req.add_header("X-Contentful-Version", str(version))
    if content_type:
        req.add_header("X-Contentful-Content-Type", content_type)
    with urllib.request.urlopen(req) as response:
        payload = response.read()
        return json.loads(payload) if payload else {}


def version_of(path):
    try:
        return call("GET", f"{BASE}{path}")["sys"]["version"]
    except urllib.error.HTTPError:
        return None


def upsert(entry_id, content_type, fields, concepts=None):
    body = {"fields": {k: {L: v} for k, v in fields.items() if v is not None}}
    if concepts:
        body["metadata"] = {
            "tags": [],
            "concepts": [
                {"sys": {"type": "Link", "linkType": "TaxonomyConcept", "id": c}}
                for c in concepts
            ],
        }
    try:
        saved = call("PUT", f"{BASE}/entries/{entry_id}", body,
                     version_of(f"/entries/{entry_id}"), content_type)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{entry_id} ({content_type}): {e.read().decode()[:500]}")
    call("PUT", f"{BASE}/entries/{entry_id}/published", version=saved["sys"]["version"])
    time.sleep(0.1)
    return entry_id


def upsert_asset(asset_id, filename, content_type, title, description=None):
    data = open(os.path.join(HERE, filename), "rb").read()
    upload_id = call("POST", f"{UPLOAD}/uploads", raw=data)["sys"]["id"]

    body = {"fields": {
        "title": {L: title},
        "description": {L: description} if description else {L: title},
        "file": {L: {
            "contentType": content_type,
            "fileName": filename,
            "uploadFrom": {"sys": {"type": "Link", "linkType": "Upload", "id": upload_id}},
        }},
    }}
    saved = call("PUT", f"{BASE}/assets/{asset_id}", body,
                 version_of(f"/assets/{asset_id}"))
    call("PUT", f"{BASE}/assets/{asset_id}/files/{L}/process",
         version=saved["sys"]["version"])

    for _ in range(25):
        time.sleep(1)
        current = call("GET", f"{BASE}/assets/{asset_id}")
        if current["fields"]["file"][L].get("url"):
            call("PUT", f"{BASE}/assets/{asset_id}/published",
                 version=current["sys"]["version"])
            return asset_id
    raise SystemExit(f"asset {asset_id} never finished processing")


def entry(entry_id):
    return {"sys": {"type": "Link", "linkType": "Entry", "id": entry_id}}


def asset(asset_id):
    return {"sys": {"type": "Link", "linkType": "Asset", "id": asset_id}}


# --- rich text ---------------------------------------------------------------

def text(value, marks=None):
    return {"nodeType": "text", "value": value,
            "marks": [{"type": m} for m in (marks or [])], "data": {}}


def para(*content):
    return {"nodeType": "paragraph", "data": {}, "content": list(content)}


def p(value):
    return para(text(value))


def h(level, value):
    return {"nodeType": f"heading-{level}", "data": {}, "content": [text(value)]}


def block(entry_id):
    return {"nodeType": "embedded-entry-block",
            "data": {"target": entry(entry_id)}, "content": []}


def inline(entry_id):
    return {"nodeType": "embedded-entry-inline",
            "data": {"target": entry(entry_id)}, "content": []}


def listing(kind, *items):
    return {"nodeType": kind, "data": {}, "content": [
        {"nodeType": "list-item", "data": {},
         "content": [i if isinstance(i, dict) else p(i)]} for i in items]}


def ol(*items):
    return listing("ordered-list", *items)


def ul(*items):
    return listing("unordered-list", *items)


def link_to(url, label):
    return {"nodeType": "hyperlink", "data": {"uri": url},
            "content": [text(label)]}


def doc(*content):
    return {"nodeType": "document", "data": {}, "content": list(content)}


# --- assets ------------------------------------------------------------------

print("assets")
LOGO = upsert_asset("ziLogo", "zoominfo-logo.png", "image/png",
                    "ZoomInfo", "ZoomInfo logo")
DIAGRAM = upsert_asset("ziIntentFlow", "intent-flow.png", "image/png",
                       "How an intent signal becomes an alert")
PDF = upsert_asset("ziExtensionPdf", "zoominfo-extension-quickstart.pdf",
                   "application/pdf", "Chrome Extension quick start")
print(f"  {LOGO}, {DIAGRAM}, {PDF}\n")


# --- reusable components -----------------------------------------------------

print("components")

upsert("ziImgLogo", "image", {
    "internalTitle": "Image: ZoomInfo logo",
    "image": asset(LOGO),
    "altText": "ZoomInfo",
})

upsert("ziImgIntentFlow", "image", {
    "internalTitle": "Image: Intent signal flow",
    "image": asset(DIAGRAM),
    "altText": "A research signal is matched to a topic, scored 0-100, then delivered as an alert.",
    "footnote": "Intent scores are recalculated weekly against a 12-week baseline.",
})

upsert("ziPdfExtension", "pdfDocument", {
    "internalTitle": "PDF: Chrome Extension quick start",
    "slug": "chrome-extension-quick-start",
    "pdf": asset(PDF),
})

# Links — internal (Link) and external (ExternalLink) are separate types.
upsert("ziLinkExtensionPdf", "link", {
    "internalTitle": "Link: Chrome Extension quick start PDF",
    "link": entry("ziPdfExtension"),
    "target": "_blank",
})
upsert("ziExtStatus", "externalLink", {
    "internalTitle": "External: ZoomInfo status page",
    "link": "https://status.zoominfo.com",
    "target": "_blank",
})
upsert("ziExtCommunity", "externalLink", {
    "internalTitle": "External: ZoomInfo community",
    "link": "https://community.zoominfo.com",
    "target": "_blank",
})
upsert("ziExtWebStore", "externalLink", {
    "internalTitle": "External: Chrome Web Store",
    "link": "https://chromewebstore.google.com",
    "target": "_blank",
})

upsert("ziBtnExtensionPdf", "button", {
    "internalTitle": "Button: Download the extension guide",
    "title": "Download the guide (PDF)",
    "link": entry("ziLinkExtensionPdf"),
    "buttonStyle": "Primary Outline",
    "rightIcon": "Download",
})
upsert("ziHlStatus", "linkText", {
    "internalTitle": "Hyperlink: status page",
    "title": "check the ZoomInfo status page",
    "link": entry("ziExtStatus"),
})
upsert("ziHlCommunity", "linkText", {
    "internalTitle": "Hyperlink: community",
    "title": "ask in the ZoomInfo community",
    "link": entry("ziExtCommunity"),
})
upsert("ziHlWebStore", "linkText", {
    "internalTitle": "Hyperlink: Chrome Web Store",
    "title": "the Chrome Web Store listing",
    "link": entry("ziExtWebStore"),
})

# Info panels
upsert("ziPanelCredits", "infoPanel", {
    "internalTitle": "Info panel: credits are spent on export",
    "type": "Info",
    "text": doc(para(
        text("Viewing a contact never spends a credit. A credit is spent the "
             "moment you export a phone number or email address — including "
             "exports made from the Chrome Extension."))),
})
upsert("ziPanelBulkLimit", "infoPanel", {
    "internalTitle": "Info panel: bulk export limits",
    "type": "Warning",
    "text": doc(para(
        text("Bulk exports are capped at 25,000 records per request. Larger "
             "lists are split automatically, but each part is billed "
             "separately. If an export stalls, "),
        inline("ziHlStatus"),
        text(" before retrying."))),
})
upsert("ziPanelSyncDanger", "infoPanel", {
    "internalTitle": "Info panel: overwriting CRM fields",
    "type": "Danger",
    "text": doc(para(
        text("Enabling “Overwrite existing values” replaces data your reps "
             "have entered by hand. There is no undo. Run a test sync against "
             "a sandbox before turning this on in production."))),
})
upsert("ziPanelApiKeys", "infoPanel", {
    "internalTitle": "Info panel: keep API keys server-side",
    "type": "Warning",
    "text": doc(para(
        text("Never embed an API key in browser code or a mobile app. Keys "
             "carry your full entitlement and cannot be scoped per user. "
             "Proxy requests through your own backend instead."))),
})

# Accordions
upsert("ziAccNoResults", "accordion", {
    "internalTitle": "FAQ: no search results",
    "icon": None,
    "headline": "My search returns no results at all",
    "bodyCopy": doc(p(
        "Usually one filter is doing the damage — most often Job Function "
        "combined with a narrow Seniority range. Remove filters one at a "
        "time, starting with the most specific, and watch the result count "
        "after each removal.")),
})
upsert("ziAccExcluded", "accordion", {
    "internalTitle": "FAQ: excluded records",
    "headline": "Why are some contacts hidden from my results?",
    "bodyCopy": doc(p(
        "Contacts suppressed by your organisation's do-not-contact list, or "
        "by a regional privacy rule, are removed before results are counted. "
        "An admin can see what was suppressed in the compliance settings.")),
})
upsert("ziAccCreditsReset", "accordion", {
    "internalTitle": "FAQ: when credits reset",
    "headline": "When do my credits reset?",
    "bodyCopy": doc(p(
        "Credits reset on the first day of your contract month, not the "
        "calendar month. Unused credits do not roll over unless your "
        "agreement includes rollover.")),
})
upsert("ziAccCreditsShared", "accordion", {
    "internalTitle": "FAQ: shared credit pool",
    "headline": "Are credits shared across my team?",
    "bodyCopy": doc(p(
        "By default every seat draws from one organisation-wide pool. Admins "
        "can set per-user monthly caps so a single user cannot exhaust it.")),
})
upsert("ziAccSyncDirection", "accordion", {
    "internalTitle": "FAQ: sync direction",
    "headline": "Does the Salesforce sync write back to ZoomInfo?",
    "bodyCopy": doc(p(
        "No. The sync is one-way, from ZoomInfo into Salesforce. Edits made "
        "in Salesforce are never pushed back, which is why the overwrite "
        "setting matters.")),
})
upsert("ziAccSyncFrequency", "accordion", {
    "internalTitle": "FAQ: sync frequency",
    "headline": "How often does the sync run?",
    "bodyCopy": doc(p(
        "Scheduled syncs run every 24 hours. You can trigger a manual sync at "
        "any time from Admin → Integrations, which does not affect the "
        "scheduled run.")),
})

upsert("ziAccSearchFaq", "accordions", {
    "internalTitle": "Accordions: search FAQs",
    "hideOnDesktop": False,
    "defaultOpen": False,
    "accordions": [entry("ziAccNoResults"), entry("ziAccExcluded")],
})
upsert("ziAccCreditsFaq", "accordions", {
    "internalTitle": "Accordions: credit FAQs",
    "hideOnDesktop": False,
    "defaultOpen": False,
    "accordions": [entry("ziAccCreditsReset"), entry("ziAccCreditsShared")],
})
upsert("ziAccSyncFaq", "accordions", {
    "internalTitle": "Accordions: Salesforce sync FAQs",
    "hideOnDesktop": False,
    "defaultOpen": False,
    "accordions": [entry("ziAccSyncDirection"), entry("ziAccSyncFrequency")],
})

# Code snippets
upsert("ziCodeAuth", "codeEmbed", {
    "internalTitle": "Code: API authentication",
    "code": (
        "curl -X POST https://api.zoominfo.com/authenticate \\\n"
        "  -H 'Content-Type: application/json' \\\n"
        "  -d '{\n"
        "        \"username\": \"<your-username>\",\n"
        "        \"password\": \"<your-password>\"\n"
        "      }'\n\n"
        "# Returns a JWT valid for 60 minutes:\n"
        "# { \"jwt\": \"eyJhbGciOiJSUzI1NiIs...\" }"
    ),
})
upsert("ziCodeEnrich", "codeEmbed", {
    "internalTitle": "Code: enrich a contact",
    "code": (
        "curl -X POST https://api.zoominfo.com/enrich/contact \\\n"
        "  -H 'Authorization: Bearer <jwt>' \\\n"
        "  -H 'Content-Type: application/json' \\\n"
        "  -d '{\n"
        "        \"matchPersonInput\": [\n"
        "          { \"emailAddress\": \"jane.doe@example.com\" }\n"
        "        ],\n"
        "        \"outputFields\": [\"firstName\", \"lastName\", \"jobTitle\", \"phone\"]\n"
        "      }'"
    ),
})
upsert("ziCodeCsv", "codeEmbed", {
    "internalTitle": "Code: bulk enrichment CSV header",
    "code": (
        "first_name,last_name,email,company_name,company_domain,linkedin_url\n"
        "Jane,Doe,jane.doe@example.com,Example Inc,example.com,\n"
        "John,Smith,,Acme Corp,acme.com,https://linkedin.com/in/johnsmith\n"
        "\n"
        "# email OR (company_domain + name) is required on every row.\n"
        "# Blank cells are fine; unmatched rows come back with a reason code."
    ),
})

upsert("ziVideoCopilot", "videoEmbed", {
    "internalTitle": "Video: Copilot account research",
    "embedCode": (
        '<iframe src="https://player.vimeo.com/video/76979871" '
        'title="Researching an account with Copilot" '
        'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>'
    ),
})

# Cards and collections
upsert("ziCardIntentTopics", "card", {
    "internalTitle": "Card: choose your topics",
    "cardBody": doc(h(3, "Choose your topics"),
                    p("Start with five to ten topics that map to a real buying "
                      "decision. Broad topics generate noise.")),
})
upsert("ziCardIntentThreshold", "card", {
    "internalTitle": "Card: set a threshold",
    "cardBody": doc(h(3, "Set a threshold"),
                    p("A score of 70 or above is a reasonable starting point. "
                      "Lower it only once your reps are working every alert.")),
})
upsert("ziCardIntentRoute", "card", {
    "internalTitle": "Card: route the alert",
    "cardBody": doc(h(3, "Route the alert"),
                    p("Send alerts where the work happens — a Slack channel "
                      "the team watches, or a CRM task queue.")),
})
upsert("ziColIntentSetup", "collection", {
    "internalTitle": "Collection: intent setup steps",
    "display": "Three Column",
    "items": [entry("ziCardIntentTopics"), entry("ziCardIntentThreshold"),
              entry("ziCardIntentRoute")],
})

upsert("ziCardCreditsMonitor", "card", {
    "internalTitle": "Card: monitor usage",
    "cardBody": doc(h(3, "Monitor usage"),
                    p("Admin → Credits shows consumption by user and by "
                      "export type for the current contract month.")),
})
upsert("ziCardCreditsCaps", "card", {
    "internalTitle": "Card: set per-user caps",
    "cardBody": doc(h(3, "Set per-user caps"),
                    p("Caps stop one bulk export from draining the shared "
                      "pool. They can be changed mid-month.")),
    "buttons": [entry("ziBtnExtensionPdf")],
})
upsert("ziColCredits", "collection", {
    "internalTitle": "Collection: managing credits",
    "display": "Two Column",
    "items": [entry("ziCardCreditsMonitor"), entry("ziCardCreditsCaps")],
})

print("  components done\n")

# --- navigation --------------------------------------------------------------

print("navigation")

NAV_TOPICS = [
    ("ziNavSearch", "Search & Filters", "search-filters"),
    ("ziNavIntent", "Intent", "intent"),
    ("ziNavIntegrations", "Integrations", "integrations"),
    ("ziNavApi", "API & Webhooks", "api-webhooks"),
    ("ziNavAdmin", "Admin & Credits", "admin-credits"),
]

# Topic pages live at /topics/<slug>, which is not an entry, so nav items use
# ExternalLink — the renderer derives the icon from the reference type, and a
# same-origin path renders without one.
for nav_id, label, slug in NAV_TOPICS:
    upsert(f"{nav_id}Link", "externalLink", {
        "internalTitle": f"Path: /topics/{slug}",
        "link": f"/topics/{slug}",
        "target": "_self",
    })
    upsert(nav_id, "menuItem", {
        "internalTitle": f"Menu: {label}",
        "title": label,
        "link": entry(f"{nav_id}Link"),
    })

upsert("ziNavAllArticlesLink", "externalLink", {
    "internalTitle": "Path: /articles",
    "link": "/articles",
    "target": "_self",
})
upsert("ziNavAllArticles", "menuItem", {
    "internalTitle": "Menu: All articles",
    "title": "All articles",
    "link": entry("ziNavAllArticlesLink"),
})

upsert("ziNavTopics", "dropdownMenu", {
    "internalTitle": "Dropdown: Browse topics",
    "title": "Browse topics",
    "menuItems": [entry(n) for n, _, _ in NAV_TOPICS],
})

upsert("ziNavCommunity", "menuItem", {
    "internalTitle": "Menu: Community",
    "title": "Community",
    "link": entry("ziExtCommunity"),
})
upsert("ziNavStatus", "menuItem", {
    "internalTitle": "Menu: System status",
    "title": "System status",
    "link": entry("ziExtStatus"),
})

upsert("ziFootPrivacyLink", "externalLink", {
    "internalTitle": "Path: privacy",
    "link": "https://www.zoominfo.com/about/privacy",
    "target": "_blank",
})
upsert("ziFootPrivacy", "menuItem", {
    "internalTitle": "Menu: Privacy Center",
    "title": "Privacy Center",
    "link": entry("ziFootPrivacyLink"),
})

upsert("LOYL9nG1zFTDZr7ev4yNg", "apps", {
    "appName": "ZoomInfo Knowledge Center",
    "appId": "contentful-kb",
    "fullColorLogo": entry("ziImgLogo"),
    "mainNavigation": [entry("ziNavAllArticles"), entry("ziNavTopics"),
                       entry("ziNavCommunity")],
    "secondaryNavigation": [entry("ziNavStatus")],
    "footerNavigation": [entry(n) for n, _, _ in NAV_TOPICS],
    "privacyNavigation": [entry("ziFootPrivacy"), entry("ziNavStatus")],
    "copyrightText": "ZoomInfo Technologies LLC",
})

print("  navigation done\n")

# --- articles ----------------------------------------------------------------

print("articles")

ARTICLES = [
    dict(
        id="ziBuildContactSearch", slug="build-a-contact-search",
        title="Build a contact search that actually returns your buyers",
        record="How To", concepts=["zi-search"], date="2026-08-04",
        summary="Layer filters in the right order so a search narrows to the "
                "people you can sell to, instead of everyone at the company.",
        body=[
            p("Most searches that return nothing were built from the inside "
              "out — a very specific job title first, everything else after. "
              "Start broad and narrow in this order instead."),
            h(2, "Build the search"),
            ol("Set the company filters first: industry, employee count, and "
               "revenue. This is the account list you are allowed to sell to.",
               "Add location. Use headquarters for account targeting, or "
               "contact location if you need someone in a specific timezone.",
               "Add Job Function, not Job Title. Titles vary wildly between "
               "companies; function does not.",
               "Only now add Seniority, and keep it to two adjacent levels.",
               "Save the search before you export anything."),
            block("ziPanelCredits"),
            h(2, "Common questions"),
            block("ziAccSearchFaq"),
        ],
    ),
    dict(
        id="ziFewResults", slug="search-returns-fewer-contacts-than-expected",
        title="Search returns fewer contacts than expected",
        record="Troubleshooting", concepts=["zi-search"], date="2026-08-11",
        summary="Why a search that should match thousands of people returns a "
                "handful, and how to find the filter responsible.",
        body=[
            p("When a result count collapses, it is almost always one filter "
              "rather than the combination. Work through these in order."),
            h(2, "Check the filter stack"),
            ol("Remove Seniority first. Pairing a narrow seniority range with "
               "Job Function is the most common cause.",
               "Check whether Contact Location is set when you meant Company "
               "Location. These filter completely different fields.",
               "Look for an active exclusion list. Suppressed contacts are "
               "removed before the count is shown.",
               "Confirm you are not filtering on a custom field that only "
               "applies to part of your CRM."),
            block("ziPanelBulkLimit"),
            h(2, "Still not right?"),
            para(text("If the filters look correct and the count is still "
                      "wrong, "),
                 inline("ziHlCommunity"),
                 text(" — someone has usually hit the same combination.")),
        ],
    ),
    dict(
        id="ziAccuracyIndicators", slug="contact-data-accuracy-indicators",
        title="What the accuracy indicators on a contact record mean",
        record="FAQ", concepts=["zi-contacts"], date="2026-07-22",
        summary="How to read the confidence signals shown next to a phone "
                "number or email address before you use them.",
        body=[
            p("Every contact detail carries a confidence signal. Reading it "
              "before you dial saves a lot of wasted calls."),
            h(2, "What each signal means"),
            ul("Green — verified in the last 90 days by at least two "
               "independent sources.",
               "Amber — verified between 90 and 180 days ago, or by a single "
               "source. Usually still correct; worth a soft check.",
               "Grey — older than 180 days, or inferred from a pattern rather "
               "than observed. Treat as a lead, not a fact.",
               "Struck through — reported as wrong and pending re-verification."),
            h(2, "Does a grey signal cost the same credit?"),
            p("Yes. Credits are spent on export, not on data quality, which "
              "is why filtering to verified-only before a bulk export is "
              "usually worth the smaller list."),
        ],
    ),
    dict(
        id="ziDataCorrection", slug="request-a-data-correction",
        title="Requesting a correction to a contact or company record",
        record="How To", concepts=["zi-contacts"], date="2026-07-29",
        summary="Report a wrong phone number, job title or company detail and "
                "track what happens to the report.",
        body=[
            p("Corrections feed straight into the verification pipeline. A "
              "reported detail is re-checked against source data, not simply "
              "deleted on your say-so."),
            h(2, "Report it"),
            ol("Open the contact or company record.",
               "Hover the field that is wrong and choose Report.",
               "Pick a reason. “No longer at company” and “Wrong number” "
               "route to different checks, so the reason matters.",
               "Add the correct value if you know it — a report with a "
               "suggested value is resolved roughly twice as fast."),
            h(2, "What happens next"),
            p("Most reports resolve within five business days. The field is "
              "marked as pending in the meantime so nobody on your team "
              "exports it by accident."),
        ],
    ),
    dict(
        id="ziHowDataSourced", slug="how-company-data-is-sourced",
        title="How company data is sourced and verified",
        record="Technical Doc", concepts=["zi-contacts"], date="2026-06-18",
        summary="The inputs behind a company record, how often each is "
                "refreshed, and what the platform will not infer.",
        body=[
            p("Company records are assembled from several independent inputs "
              "and reconciled, rather than scraped from a single source."),
            h(2, "Inputs"),
            ul("Public filings and registry data — refreshed quarterly.",
               "Company websites and careers pages — crawled weekly.",
               "Contributory network signals from opted-in participants.",
               "Direct verification by research teams for enterprise accounts."),
            h(2, "What is never inferred"),
            p("Revenue and employee count for private companies are modelled "
              "and labelled as estimates. They are never presented as "
              "confirmed figures, and the confidence band is shown on the "
              "record."),
            h(2, "Refresh cadence"),
            p("A company record is fully reconciled every 30 days. "
              "Individually reported corrections are applied as they resolve, "
              "without waiting for the next cycle."),
        ],
    ),
    dict(
        id="ziIntentGettingStarted", slug="getting-started-with-intent",
        title="Getting started with Intent signals",
        record="How To", concepts=["zi-intent"], date="2026-08-19",
        summary="Pick topics, set a threshold and route alerts so Intent "
                "produces a shortlist rather than noise.",
        body=[
            p("Intent tells you which accounts are researching a problem you "
              "solve. It is only useful if the output is small enough that "
              "someone actually works it."),
            block("ziColIntentSetup"),
            h(2, "How a signal becomes an alert"),
            block("ziImgIntentFlow"),
            h(2, "A sensible first configuration"),
            ol("Choose five topics tied to a real buying decision.",
               "Set the threshold to 70.",
               "Route to one Slack channel, not to individual reps.",
               "Review after two weeks and adjust the threshold before "
               "adding more topics."),
        ],
    ),
    dict(
        id="ziIntentScoring", slug="how-intent-topics-are-scored",
        title="How Intent topics are scored",
        record="FAQ", concepts=["zi-intent"], date="2026-08-21",
        summary="What the 0-100 intent score represents and why it is "
                "relative rather than absolute.",
        body=[
            p("An intent score is a comparison, not a measurement. It asks "
              "whether this account is researching a topic more than it "
              "normally does."),
            h(2, "The calculation"),
            ul("Research activity is matched to a topic from the taxonomy.",
               "Activity is compared to that account's own 12-week baseline.",
               "The deviation is normalised to a 0–100 score.",
               "Scores refresh weekly, not daily."),
            h(2, "Why a big account can score low"),
            p("A large enterprise that always reads about security will not "
              "spike when it starts a security project — its baseline is "
              "already high. This is deliberate: the score surfaces change, "
              "and change is what indicates a buying cycle."),
        ],
    ),
    dict(
        id="ziIntentSlack", slug="send-intent-alerts-to-slack",
        title="Sending Intent alerts to Slack",
        record="How To", concepts=["zi-intent", "zi-integrations"],
        date="2026-08-25",
        summary="Route intent spikes into a Slack channel, with only the "
                "fields a rep needs to act.",
        body=[
            p("Alerts that arrive where the team already works get acted on. "
              "Alerts that arrive by email mostly do not."),
            h(2, "Connect Slack"),
            ol("Open Admin → Integrations → Slack and authorise the "
               "workspace. You need to be a Slack workspace admin.",
               "Choose the destination channel. A shared channel beats DMs — "
               "alerts get picked up when someone is out.",
               "Select which fields appear: account name, topic, score and "
               "owner is usually enough.",
               "Send a test alert before enabling the schedule."),
            block("ziPanelBulkLimit"),
        ],
    ),
    dict(
        id="ziCopilotAccountResearch", slug="copilot-account-research",
        title="Researching an account with Copilot",
        record="How To", concepts=["zi-copilot"], date="2026-09-02",
        summary="Ask Copilot questions about an account and get an answer "
                "grounded in your CRM and ZoomInfo data.",
        body=[
            p("Copilot answers questions about a specific account using the "
              "data you already have access to. It does not browse the open "
              "web at query time."),
            h(2, "Watch it work"),
            block("ziVideoCopilot"),
            h(2, "Questions that work well"),
            ul("“What changed at this account in the last quarter?”",
               "“Who are the likely economic buyers here?”",
               "“What are they showing intent for?”",
               "“Summarise our last three conversations with them.”"),
            h(2, "Questions that do not"),
            p("Anything needing information outside your entitlement — "
              "private financials, or activity at an account you have no "
              "access to — returns an explicit “not available” rather than "
              "a guess."),
        ],
    ),
    dict(
        id="ziCopilotData", slug="what-data-copilot-uses",
        title="What data Copilot uses to generate recommendations",
        record="FAQ", concepts=["zi-copilot"], date="2026-09-04",
        summary="The sources behind a Copilot answer, and the boundaries it "
                "will not cross.",
        body=[
            p("Copilot is grounded in three sources, in this order of "
              "precedence."),
            h(2, "Sources"),
            ol("Your CRM records, including activity history, where the "
               "integration is connected.",
               "ZoomInfo contact, company and intent data within your "
               "entitlement.",
               "Conversation data from Chorus, if licensed."),
            block("ziPanelApiKeys"),
            h(2, "What it will not do"),
            ul("Surface a contact your licence does not cover.",
               "Use another customer's data. Ever.",
               "Invent a figure when the underlying field is empty."),
        ],
    ),
    dict(
        id="ziConnectSalesforce", slug="connect-zoominfo-to-salesforce",
        title="Connecting ZoomInfo to Salesforce",
        record="How To", concepts=["zi-integrations"], date="2026-07-08",
        summary="Install the managed package, map your fields and run a "
                "first sync safely.",
        body=[
            p("Budget about an hour, and do the first run against a sandbox. "
              "The field mapping step is the one that repays care."),
            h(2, "Install and connect"),
            ol("Install the ZoomInfo managed package from AppExchange into "
               "your sandbox.",
               "In ZoomInfo, open Admin → Integrations → Salesforce and "
               "authorise with a Salesforce user that has API access.",
               "Map fields. Leave anything you are unsure about unmapped — "
               "an unmapped field is easy to add later.",
               "Run a test sync limited to 50 records and inspect the result "
               "in Salesforce.",
               "Repeat the connection in production once the sandbox result "
               "looks right."),
            block("ziPanelSyncDanger"),
            h(2, "Common questions"),
            block("ziAccSyncFaq"),
        ],
    ),
    dict(
        id="ziSalesforceSyncFails", slug="salesforce-sync-failed",
        title="A Salesforce sync failed or finished with errors",
        record="Troubleshooting", concepts=["zi-integrations"],
        date="2026-07-15",
        summary="Read the sync error report and fix the four causes that "
                "account for most failures.",
        body=[
            p("Open Admin → Integrations → Salesforce → Sync history and "
              "download the error report before changing anything. It names "
              "the failing record and the reason."),
            h(2, "The usual causes"),
            ul("Expired OAuth token — the connected Salesforce user changed "
               "their password or was deactivated. Reconnect.",
               "A required Salesforce field is unmapped, so the record cannot "
               "be created. The report names the field.",
               "Validation rule rejection. ZoomInfo data is valid but your "
               "org's rule refuses it; the rule needs an exception.",
               "API limit reached for the day. The sync resumes on the next "
               "scheduled run."),
            para(text("If the report shows none of these, "),
                 inline("ziHlStatus"),
                 text(" — a platform incident produces errors that look like "
                      "mapping failures.")),
        ],
    ),
    dict(
        id="ziBulkEnrichCsv", slug="bulk-enrichment-with-a-csv",
        title="Running a bulk enrichment from a CSV",
        record="How To", concepts=["zi-enrich"], date="2026-06-30",
        summary="Format the file, upload it, and understand why some rows "
                "come back unmatched.",
        body=[
            p("Bulk enrichment takes a list you already have and fills in what "
              "is missing. Match rate depends almost entirely on how the file "
              "is formatted."),
            h(2, "File format"),
            block("ziCodeCsv"),
            h(2, "Upload"),
            ol("Open Enrich → New job and upload the CSV.",
               "Map your columns to ZoomInfo fields. The importer guesses, "
               "but check the mapping.",
               "Choose the output fields. Every additional field costs "
               "credits per matched row.",
               "Run the job. Files over 50,000 rows are queued and you get an "
               "email when they finish."),
            block("ziPanelBulkLimit"),
        ],
    ),
    dict(
        id="ziEnrichFieldMapping", slug="enrich-field-mapping-reference",
        title="Enrich field mapping reference",
        record="Technical Doc", concepts=["zi-enrich"], date="2026-06-24",
        summary="Every output field available to an enrichment job, with its "
                "type and whether it costs a credit.",
        body=[
            p("Output fields fall into three groups. Only the third group "
              "costs credits."),
            h(2, "Firmographic — no credit"),
            ul("company_name, company_domain, company_industry",
               "employee_count, revenue_range, hq_location",
               "founded_year, company_type"),
            h(2, "Person attributes — no credit"),
            ul("first_name, last_name, job_title, job_function",
               "seniority, department, linkedin_url"),
            h(2, "Contact details — one credit per matched row"),
            ul("email_address, direct_phone, mobile_phone"),
            block("ziPanelCredits"),
        ],
    ),
    dict(
        id="ziEngageSequence", slug="send-a-sequence-with-engage",
        title="Sending a sequence with Engage",
        record="How To", concepts=["zi-engage"], date="2026-08-13",
        summary="Build a multi-step sequence, add contacts from a search, and "
                "keep it out of spam folders.",
        body=[
            p("Engage sends from your own mailbox, not a shared relay, so "
              "deliverability depends on your domain being set up correctly "
              "before the first send."),
            h(2, "Before your first sequence"),
            ol("Connect your mailbox under Engage → Settings.",
               "Confirm SPF and DKIM are configured for your sending domain. "
               "Engage warns you if they are not.",
               "Set a daily send cap. Start at 50 and raise it slowly over "
               "two weeks."),
            h(2, "Build the sequence"),
            ol("Create the sequence and add steps. Three to five touches over "
               "two weeks works better than ten over three days.",
               "Write each step as though it is the only one that will be "
               "read, because usually it is.",
               "Add contacts directly from a saved search.",
               "Enable reply detection so a response stops the sequence."),
        ],
    ),
    dict(
        id="ziInstallExtension", slug="install-the-chrome-extension",
        title="Installing the ZoomInfo Chrome Extension",
        record="How To", concepts=["zi-extension"], date="2026-09-08",
        summary="Install, sign in and pin the extension so contact data is "
                "available on LinkedIn and company websites.",
        body=[
            p("The extension surfaces ZoomInfo data on the page you are "
              "already looking at — a LinkedIn profile, a company website, or "
              "an inbox."),
            h(2, "Install"),
            ol("Open the extension listing in the Chrome Web Store and choose "
               "Add to Chrome.",
               "Sign in with your ZoomInfo credentials. SSO works if your "
               "organisation uses it.",
               "Pin the extension so the icon stays visible.",
               "Open any company website and click the icon."),
            para(text("You can also install directly from "),
                 inline("ziHlWebStore"),
                 text(".")),
            h(2, "Take the guide with you"),
            para(inline("ziBtnExtensionPdf")),
            block("ziPanelCredits"),
        ],
    ),
    dict(
        id="ziApiAuth", slug="authenticating-with-the-api",
        title="Authenticating with the ZoomInfo API",
        record="Technical Doc", concepts=["zi-api"], date="2026-05-20",
        summary="Exchange credentials for a JWT, refresh it before it "
                "expires, and keep the key server-side.",
        body=[
            p("Every API call needs a JWT. Tokens are valid for 60 minutes; "
              "request a new one rather than retrying with an expired token."),
            h(2, "Get a token"),
            block("ziCodeAuth"),
            h(2, "Use the token"),
            block("ziCodeEnrich"),
            block("ziPanelApiKeys"),
            h(2, "Rate limits"),
            ul("1,500 requests per minute per organisation.",
               "A 429 response includes Retry-After — honour it rather than "
               "backing off blindly.",
               "Bulk endpoints count as one request regardless of batch size."),
        ],
    ),
    dict(
        id="ziCreditsUsage", slug="how-credits-work",
        title="How credits work and how to monitor usage",
        record="FAQ", concepts=["zi-admin"], date="2026-06-10",
        summary="What spends a credit, what does not, and how admins keep a "
                "single bulk export from draining the pool.",
        body=[
            p("Credits are spent on acquiring contact details, not on "
              "searching or viewing. Almost every surprise on a usage report "
              "comes from a bulk export."),
            h(2, "What spends a credit"),
            ul("Exporting an email address or phone number.",
               "Enriching a row where a contact detail is returned.",
               "Pushing a contact to your CRM from the extension."),
            h(2, "What does not"),
            ul("Running a search, however many results it returns.",
               "Viewing a contact record on screen.",
               "Firmographic fields — company size, industry, revenue."),
            block("ziColCredits"),
            h(2, "Common questions"),
            block("ziAccCreditsFaq"),
        ],
    ),
    dict(
        id="ziNewsCopilotMultiAccount", slug="copilot-multi-account-research",
        title="Copilot now researches multiple accounts at once",
        record="News", concepts=["zi-copilot"], date="2026-09-15",
        summary="Ask one question across a saved account list and get a "
                "comparison rather than a single answer.",
        body=[
            p("Copilot can now answer a question across every account in a "
              "saved list, returning a comparison table instead of one "
              "account at a time."),
            h(2, "What changed"),
            ul("Ask “Which of these accounts is showing buying intent?” "
               "against a list of up to 250 accounts.",
               "Results come back as a sortable table you can export.",
               "Each row links to the account record and cites the fields the "
               "answer used."),
            h(2, "Availability"),
            p("Rolling out to all Copilot licences through September 2026. No "
              "action is needed — the option appears in the Copilot panel "
              "once your org is enabled."),
        ],
    ),
    dict(
        id="ziNewsIntentTaxonomy", slug="intent-taxonomy-expansion",
        title="Intent taxonomy expanded to 4,500 topics",
        record="News", concepts=["zi-intent"], date="2026-09-11",
        summary="New topics across AI infrastructure, data governance and "
                "vertical software, plus what happens to your saved topics.",
        body=[
            p("The intent taxonomy has grown by roughly 600 topics, "
              "concentrated in areas where buying activity has moved fastest "
              "over the last year."),
            h(2, "Where the new topics are"),
            ul("AI infrastructure — model hosting, vector databases, "
               "inference cost management.",
               "Data governance — lineage, retention policy, access review.",
               "Vertical software for healthcare, logistics and construction."),
            h(2, "Do I need to do anything?"),
            p("No. Existing topic selections are unchanged and existing "
              "baselines carry over. New topics start accumulating a baseline "
              "from the date they were added, so their scores stabilise after "
              "about 12 weeks."),
            block("ziPanelBulkLimit"),
        ],
    ),
]

assert len(ARTICLES) == 20, f"expected 20 articles, got {len(ARTICLES)}"

for a in ARTICLES:
    seo_id = f"{a['id']}Seo"
    upsert(seo_id, "metadata", {
        "internalTitle": f"SEO: {a['title']}"[:255],
        "title": a["title"],
        "description": a["summary"][:300],
        "searchEngineVisibility": "follow",
        "searchIndex": "index",
    })
    upsert(a["id"], "article", {
        "title": a["title"],
        "slug": a["slug"],
        "publishDate": f"{a['date']}T09:00:00.000Z",
        "summary": a["summary"],
        "bodyCopy": doc(*a["body"]),
        "recordType": a["record"],
        "channelVisibility": "Public",
        "keywords": [w for w in a["slug"].split("-") if len(w) > 3][:6],
        "articleFeedback": {"up": 0, "down": 0},
        "seo": entry(seo_id),
    }, concepts=a["concepts"])
    print(f"  {a['record']:<15} {a['slug']}")

print(f"\ndone — {len(ARTICLES)} articles")
