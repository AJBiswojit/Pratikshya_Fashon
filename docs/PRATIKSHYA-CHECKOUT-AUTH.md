# Checkout authentication

Customer storefront orders require an authenticated customer identity. Guests may browse, add to the bag, and review checkout, but the checkout payment action opens the existing sign-in/create-account flow with `returnTo=/checkout`.

## Enforcement

- `Checkout.jsx` presents the Atelier authentication gate before payment.
- `CheckoutContext.startPayment` checks the live `AuthContext` identity before inventory reservation or payment creation.
- `orderService.addOrder` rejects new storefront snapshots without `customerId` using `CUSTOMER_AUTH_REQUIRED`.
- Payment success remains idempotent through the existing session/completed-order guards; failure and cancellation retain existing reservation release behavior.
- Buy Now uses the existing cart/checkout route and therefore shares this boundary.

The existing cart and safe checkout persistence are unchanged, so guest bags survive authentication. Existing historical/demo orders are untouched. Employee-assisted orders may explicitly use the existing `employee_assisted` source and are not subject to the storefront customer-login requirement.

## Verification

Build: `npm run build`
Tests: `npm test`
Static validation: `git diff --check`

Future production hardening should duplicate this authorization at the server/API order mutation boundary; this frontend service boundary is the current application enforcement point.
