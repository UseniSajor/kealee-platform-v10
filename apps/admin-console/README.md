# admin-console (deprecated)

This app has been merged into **os-admin** (`apps/os-admin`), deployed at [admin.kealee.com](https://admin.kealee.com).

| Former route | os-admin route |
|--------------|----------------|
| `/validation` | `/validation` (concept QA queue) |
| `/schema` | `/schema` |
| `/test-panel` | `/test-panel` |
| `/users`, `/orgs`, `/subscriptions` | Same paths (richer UI in os-admin) |

Do not create new Vercel or Railway projects for `admin-console`. Point `admin.kealee.com` at the **os-admin** Vercel project only.
