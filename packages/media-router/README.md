# Kealee Media Router

One server-side boundary for generated images and video used by the Kealee
platform and Marketing OS.

## Routing policy

| Intent | Preferred route |
| --- | --- |
| Specialized/open-source models and image processing | Replicate |
| Cinematic video | Higgsfield, then direct Seedance, Veo, Replicate |
| Renovation/development visualization | Higgsfield, then direct Seedance, Veo, Replicate |
| Marketing image and prompt-to-video content | Higgsfield, then direct Seedance, Veo, Replicate |

Callers may pin a provider for deterministic jobs. Pinned jobs fail rather than
silently switching providers. Unpinned jobs fall through the configured route.
New adapters implement `MediaProviderAdapter` and can be registered with
`KealeeMediaRouter.register()` without adding provider SDKs to product code.

The authenticated web entry point is `POST /api/media/generate`; poll a returned
job with `GET /api/media/generate?provider=...&kind=...&model=...&jobId=...`.
Both endpoints accept `Authorization: Bearer <MEDIA_ROUTER_API_KEY>` or the
`x-media-router-key` header.
