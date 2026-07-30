# Product requirements

## Roles

- Visitor: browse, search, filter, and submit quote requests
- Sales: review quotes and update quote status
- Inventory manager: create and edit products and adjust stock
- Administrator: manage staff permissions and all operational settings

Authorization must be enforced on the server for every protected action.

## Core acceptance criteria

- Products support creation, editing, visibility, inventory, categories, pricing, and durable images.
- Visitors can filter and search the catalog and receive a clear quote confirmation.
- Inventory changes are validated and recorded with actor, reason, and timestamp.
- Mobile, desktop, keyboard, error, empty, and slow-network states are supported.
