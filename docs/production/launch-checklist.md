# Bayzid Shoes — production launch checklist

## Appwrite development

- Redeploy `create-order` after the COD-only source change.
- Redeploy `manage-order` after customer cancellation and Pathao changes.
- Configure the `return_requests` table and management-team permissions.
- Run pending → confirmed → processing → shipped → delivered.
- Run pending/confirmed cancellation and verify stock is restored exactly once.
- Verify customer cancellation is rejected after processing.
- Verify an `online` order is rejected while COD-only mode is active.
- Create and test one Pathao shipment; verify duplicate shipment creation is blocked.

## Digital payment

The current checkout is intentionally COD-only. Online payment is not activated until a gateway is selected and its server-side verification/webhook contract is implemented.

Production payment requirements:

- Initialization happens server-side.
- The browser never decides that an order is paid.
- Callback/webhook signatures are verified server-side.
- Payment updates are idempotent and tied to the exact order and amount.
- Refunds create auditable `payment_transactions` rows.
- Gateway secrets never use `VITE_*` variables.
