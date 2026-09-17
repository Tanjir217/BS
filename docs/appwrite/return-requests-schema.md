# Return requests — Appwrite TablesDB

Create a new table named `return_requests` in the existing Appwrite database.

## Columns

| Key | Type | Size | Required | Purpose |
|---|---|---:|---|---|
| `return_Number` | varchar | 255 | yes | Human-facing return/exchange reference |
| `order_ID` | varchar | 255 | yes | Original order ID |
| `customer_ID` | varchar | 255 | yes | Appwrite customer user ID |
| `request_Type` | varchar | 32 | yes | `return` or `exchange` |
| `reason` | varchar | 255 | yes | Customer-selected reason |
| `details` | text | — | no | Customer explanation |
| `requested_Item_IDs` | text | — | yes | Comma-separated Order Item row IDs |
| `exchange_Note` | text | — | no | Desired exchange details |
| `status` | varchar | 32 | yes | `requested`, `approved`, `rejected`, `pickup`, `received`, `completed`, `cancelled` |
| `resolution` | varchar | 32 | yes | `pending`, `refund`, `exchange`, `replacement` |
| `refund_Amount` | integer | — | yes | Approved refund amount in BDT, default 0 |
| `management_Note` | text | — | no | Internal management note |

## Indexes

Create key indexes for:

- `order_ID`
- `customer_ID`
- `status`
- `return_Number` (unique)
- `createdAt` if your Appwrite setup exposes the system timestamp for indexing; otherwise use `$createdAt` only for sorting where supported.

## Permissions

Enable Row Security.

Table-level permissions:

- **Create:** authenticated users only.
- Do **not** grant table-level Read, Update, or Delete to customers.

The customer app creates each row with a row-level Read permission for the creating customer. The server-side `manage-order` Function uses its API key for management operations and therefore does not depend on row permissions.

This follows Appwrite's row-security model: table-level create permission is needed for client row creation, while row-level permissions restrict access to the individual request. citeturn8search0turn8search3
