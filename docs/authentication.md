# Authentication and authorization

The storefront remains public. Staff routes require platform-verified identity. Roles are visitor, sales, inventory manager, and administrator.

Every protected page and mutation must check identity and role server-side. Client-side hidden controls are not authorization. Logout, expired sessions, unauthorized access, and permission changes require explicit tests before launch.
