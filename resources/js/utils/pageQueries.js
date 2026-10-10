// Shared query definitions so routes can prefetch page data while their code chunk downloads.

export const cmsPageQuery = (slug) => ({
  queryKey: ['policy-page', slug],
  queryFn: async () => {
    const response = await fetch(`/api/pages/${slug}`);
    const payload = await response.json();
    if (!response.ok && response.status !== 404) throw new Error(payload?.message || 'Unable to load page');
    return payload;
  },
  staleTime: 60_000,
});
