# PRATIKSHYA AI — Shopping & Business Assistants (Phase 21.1)

Two premium, realistic AI assistant experiences, built **frontend-only**:

| Assistant | Audience | Route | Feel |
| --- | --- | --- | --- |
| AI Shopping Assistant | Customers | `/account/ai-shopping` | Editorial, fashionable, personal, calm |
| AI Business Assistant | Admin / managers (super-admin role) | `/admin/ai-assistant` | Precise, executive, operational |

> **This phase ships a deterministic mock intelligence.** No LLM, no external
> AI API, no vector database and no paid provider is used. The architecture
> is shaped so a real provider can replace the mock without rebuilding any UI.

---

## 1. Architecture

```
Customer/Admin UI (pages + components)
        │  never touches mock internals
        ▼
aiService.js  ────────────── central door, provider-agnostic
        │
        ▼
aiProvider.js  ───────────── provider contract (interface)
        │
        ▼
mockAiProvider.js  ───────── deterministic demo provider (today)
        │                │
        ▼                ▼
shopping/           business/
aiShoppingService   aiBusinessService
        │                │
        ▼                ▼
Existing PRATIKSHYA repositories — the ONLY sources of truth:
  · data/products + catalogRepository (catalogue, prices, availability)
  · taxonomyRepository (categories, subcategories, collections)
  · mediaRepository / productMediaSource (covers)
  · inventoryRepository (via the analytics inventory summary)
  · orderService / OrderContext (orders register)
  · returnService (returns lifecycle)
  · offerRepository (offers + redemptions)
  · analyticsService + dateRange (Phase 19 read-model and presets)
  · AccountContext / AuthContext (customer registry)
  · WishlistContext, ShoppingContext (bag + wishlist)
  · stylePreferences + personalization (Phase 19 style signals)
  · recentlyViewed (customer browsing history)
  · workforce services (attendance + performance, via analytics)
  · activityService (the one shared activity diary)
```

### File map

```
src/services/ai/
  aiProvider.js                 provider contract + validation
  aiService.js                  central abstraction (active provider lives here)
  mockAiProvider.js             deterministic provider (pacing + delegation)
  aiSessionStore.js             demo persistence (id-scoped, product ids only)
  shared/
    aiIntentResolver.js         pure NLP helpers (price, keywords, periods)
    aiResponseBuilder.js        response envelopes + privacy audit
  shopping/
    aiShoppingService.js        intent resolution + deterministic ranking
    aiShoppingMockData.js       brand copy, quick prompts, stage language
  business/
    aiBusinessService.js        question routing + insight builders
    aiBusinessMockData.js       quick questions, action map, stage language

src/components/aiAssistants/
  AiComposer.jsx                labelled input, keyboard submission
  AiConversationLog.jsx         aria-live conversation surface
  AiThinkingIndicator.jsx       thinking stages (aria-busy)
  AiQuickPrompts.jsx            accessible suggestion chips
  AiProductCard.jsx             recommendation card on Atelier media architecture
  AiShoppingMessage.jsx         renders every shopping envelope type
  AiBusinessMessage.jsx         renders every business insight envelope

src/pages/account/AiShoppingAssistant.jsx
src/pages/admin/AiBusinessAssistant.jsx

tests/aiShopping.test.js        pure-logic tests (node --test)
tests/aiBusiness.test.js        pure-logic tests (node --test)
```

### Provider replacement (future real AI)

1. Implement the contract in `aiProvider.js` in a new file
   (e.g. `realAiProvider.js`): `id`, `label`, `respondShopping(request)`,
   `respondBusiness(request)`.
2. In `aiService.js`, change **one import** to the new provider.
3. Done. Every screen, route, quick prompt, thinking stage and response
   renderer keeps working because they only speak the envelope contract.

The mock provider never invents business numbers: the business envelope is
built from `getAnalyticsSnapshot()` (the existing Phase 19 read-model), and
the shopping envelope only carries products that exist in the live
catalogue.

---

## 2. Response contracts

### Shopping envelopes

`TEXT`, `PRODUCT_RECOMMENDATIONS`, `PRODUCT_COMPARISON`, `OUTFIT_SUGGESTION`,
`PRICE_FILTER`, `NO_RESULTS`, `FOLLOW_UP`, `CART_ACTION`, `WISHLIST_ACTION`,
`PRODUCT_CONTEXT`.

Each recommendation carries a human-readable `reason` composed from the
signals that actually earned the piece its rank — never a generic line.

### Business envelopes

`BUSINESS_SUMMARY`, `SALES_INSIGHT`, `PRODUCT_INSIGHT`, `CATEGORY_INSIGHT`,
`CUSTOMER_INSIGHT`, `INVENTORY_INSIGHT`, `RETURN_INSIGHT`, `OFFER_INSIGHT`,
`FULFILLMENT_INSIGHT`, `WORKFORCE_INSIGHT`, `RECOMMENDATION`, `ALERT`,
`TREND`, `NO_DATA`.

Insufficient data is spoken plainly: *"Not enough data is available for this
insight."* — the assistant never pads a gap with invented figures.

---

## 3. Customer AI Shopping Assistant

- Entry points: **My PRATIKSHYA dashboard card**, **account navigation**,
  and a quiet *"Ask PRATIKSHYA AI about this piece"* link on every product
  detail page (`/account/ai-shopping?product=<id>` preserves the product
  context for similarity, pairing and alternative questions).
- Understands occasion, category, fabric, colour, budget (₹, k, lakh,
  ranges, ceilings and floors), new arrivals, bestsellers/trending,
  discounts, similarity, pairing, outfit building, comparison, cart and
  wishlist intents — all deterministic keyword + price parsing.
- Ranking signals: explicit request, category, fabric, colour, occasion,
  collection, price range, availability, wishlist, recently viewed,
  purchase history, Phase 19 style preferences, and merchandising flags.
  Ties break on rating → price → id, so the same request always produces
  the same edit.
- No-result handling relaxes gracefully (drop colour → drop fabric → widen
  budget) and only then admits it found nothing — always with a next step.
- Outfits keep the **AI Mirror apparel rule**: the main piece is always
  apparel (saree, lehenga, suit, kurta, menswear, kidswear); finishing
  pieces (dupattas, bangles, jewellery) are styling suggestions for AI
  Shopping only. AI Mirror's own eligibility logic is untouched.
- Cart/wishlist intents perform real actions through the existing
  `CartContext` / `WishlistContext`; made-to-order or unavailable pieces
  are never added silently.

## 4. Admin AI Business Assistant

- Lives behind the existing `AdminProtectedRoute` (super-admin only) and
  re-checks authorization in the service layer (`canUseBusinessAssistant`).
  Customers and employees can never reach it.
- Reuses the **Phase 19 analytics period presets** (Today, Yesterday,
  Last 7/30 days, This/Last month, This quarter, This year) — the question
  itself can re-scope the period ("this month"), but no second date system
  exists.
- Answers business questions with narrative + metric tiles + supporting
  rows + operational actions that deep-link to the existing admin surfaces
  (orders, inventory, low stock, returns, offers, customers, analytics,
  employees, attendance, performance).
- Privacy: customer insights speak names and aggregates only — emails,
  phones, passwords and secrets never enter the conversation; workforce
  names are in-scope for the authorized admin.

## 5. Thinking experience

Both assistants show short, deterministic stages ("Understanding your
request…", "Checking catalogue data…", "Preparing recommendations…") with a
total pacing of roughly 1.2–1.6 seconds. No excessive delays, no fake
confidence percentages, and the UI carries an honest "demo assistant"
footnote wherever the mock provider is active.

## 6. Sessions & privacy

- Conversations persist per customer/admin id as a **demo convenience**
  (`pratikshya_ai_shopping_session_*` / `pratikshya_ai_business_session_*`),
  capped at 80 messages.
- Shopping persistence stores product **ids only** — products are
  re-resolved from the live catalogue on restore, so no stale price or
  availability can survive a reload.
- Nothing sensitive is stored: no camera frames (the assistants never touch
  a camera), no credentials, no full query transcripts in the activity log.

## 7. Activity logging

Uses the existing `activityService` diary — no second log. New actions:
`AI_SHOPPING_SESSION_STARTED`, `AI_SHOPPING_QUERY`, `AI_BUSINESS_QUERY`,
`AI_BUSINESS_INSIGHT_VIEWED`, `AI_BUSINESS_ACTION_OPENED`.

## 8. Limitations

- Intelligence is deterministic keyword/intent matching, not machine
  learning — the UI never claims otherwise.
- Very unusual phrasings may fall through to a calm follow-up question.
- The business assistant answers from the analytics snapshot at question
  time; live register changes after the answer are reflected in the next
  question.
- Session persistence is demo-grade local storage, not a durable
  conversation store.

## 9. Testing

```
npm test        # node --test tests/*.test.js — 36 pure-logic tests
npm run build   # production build
```

Tests cover: price extraction, category/fabric/colour/occasion detection,
ranking, no-result handling, product context, cart/wishlist intents, outfit
rules, business topic routing, every insight builder against fixture
snapshots, insufficient-data handling, permission enforcement, and the
customer/business privacy boundary.
