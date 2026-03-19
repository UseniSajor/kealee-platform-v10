/**
 * services/api/src/modules/marketplace/slug.service.ts
 * Contractor profile slug generation and uniqueness enforcement.
 */

export function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function ensureUniqueSlug(
  baseSlug: string,
  prisma: any,
  excludeId?: string,
): Promise<string> {
  let slug   = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.contractorProfile.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
}
