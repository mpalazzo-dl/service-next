#!/usr/bin/env python3
"""Create the ZoomInfo product taxonomy (org-level) and bind it to `article`."""
import json
import os
import urllib.error
import urllib.request

ORG = "0EJtkVUGWJCta9Kk8Q3ZCB"
SPACE = os.environ["NEXT_PUBLIC_CF_SPACE"]
ENV = os.environ["NEXT_PUBLIC_CF_ENVIRONMENT"]
TOKEN = os.environ["NEXT_CF_MANAGEMENT_TOKEN"]

ORG_BASE = f"https://api.contentful.com/organizations/{ORG}/taxonomy"
SPACE_BASE = f"https://api.contentful.com/spaces/{SPACE}/environments/{ENV}"

SCHEME_ID = "cs-zoominfo-products"
SCHEME_LABEL = "Products (ZoomInfo)"

# Ten product areas, matching how ZoomInfo's own knowledge center is organised.
CONCEPTS = [
    ("zi-search", "Search & Filters"),
    ("zi-contacts", "Contacts & Companies"),
    ("zi-intent", "Intent"),
    ("zi-copilot", "Copilot"),
    ("zi-engage", "Engage"),
    ("zi-enrich", "Enrich"),
    ("zi-integrations", "Integrations"),
    ("zi-extension", "Chrome Extension"),
    ("zi-api", "API & Webhooks"),
    ("zi-admin", "Admin & Credits"),
]


def call(method, url, body=None, version=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Content-Type", "application/json")
    if body is not None:
        req.data = json.dumps(body).encode()
    if version is not None:
        req.add_header("X-Contentful-Version", str(version))
    try:
        with urllib.request.urlopen(req) as response:
            payload = response.read()
            return json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:400]
        print(f"    !! {method} {url.split('/taxonomy/')[-1][:60]} -> {e.code}\n       {detail}")
        raise


def upsert_concept(concept_id, label):
    body = {
        "prefLabel": {"en-US": label},
        "definition": {"en-US": f"ZoomInfo help articles about {label.lower()}."},
    }
    try:
        current = call("GET", f"{ORG_BASE}/concepts/{concept_id}")
        # PATCH needs a JSON-Patch body; a full replace is simpler via PUT.
        call("PUT", f"{ORG_BASE}/concepts/{concept_id}", body, current["sys"]["version"])
        return "updated"
    except urllib.error.HTTPError:
        call("PUT", f"{ORG_BASE}/concepts/{concept_id}", body)
        return "created"


print(f"org={ORG}\n")

for concept_id, label in CONCEPTS:
    result = upsert_concept(concept_id, label)
    print(f"  {result:<8} {concept_id:<18} {label}")

scheme_body = {
    "prefLabel": {"en-US": SCHEME_LABEL},
    "definition": {"en-US": "Product areas of the ZoomInfo platform."},
    "topConcepts": [
        {"sys": {"type": "Link", "linkType": "TaxonomyConcept", "id": cid}}
        for cid, _ in CONCEPTS
    ],
    "concepts": [
        {"sys": {"type": "Link", "linkType": "TaxonomyConcept", "id": cid}}
        for cid, _ in CONCEPTS
    ],
}

try:
    current = call("GET", f"{ORG_BASE}/concept-schemes/{SCHEME_ID}")
    call("PUT", f"{ORG_BASE}/concept-schemes/{SCHEME_ID}", scheme_body,
         current["sys"]["version"])
    print(f"\n  updated scheme {SCHEME_ID}")
except urllib.error.HTTPError:
    call("PUT", f"{ORG_BASE}/concept-schemes/{SCHEME_ID}", scheme_body)
    print(f"\n  created scheme {SCHEME_ID}")

# Bind the article content type to the new scheme.
ct = call("GET", f"{SPACE_BASE}/content_types/article")
body = {k: ct[k] for k in ("name", "description", "displayField", "fields") if k in ct}
body["metadata"] = {
    "taxonomy": [
        {
            "sys": {
                "id": SCHEME_ID,
                "type": "Link",
                "linkType": "TaxonomyConceptScheme",
            },
            "required": False,
        }
    ]
}

req = urllib.request.Request(f"{SPACE_BASE}/content_types/article", method="PUT")
req.add_header("Authorization", f"Bearer {TOKEN}")
req.add_header("Content-Type", "application/vnd.contentful.management.v1+json")
req.add_header("X-Contentful-Version", str(ct["sys"]["version"]))
req.data = json.dumps(body).encode()
with urllib.request.urlopen(req) as response:
    saved = json.loads(response.read())

pub = urllib.request.Request(
    f"{SPACE_BASE}/content_types/article/published", method="PUT"
)
pub.add_header("Authorization", f"Bearer {TOKEN}")
pub.add_header("X-Contentful-Version", str(saved["sys"]["version"]))
urllib.request.urlopen(pub).read()

print(f"  article content type bound to {SCHEME_ID}")
