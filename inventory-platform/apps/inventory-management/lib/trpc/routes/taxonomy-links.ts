import { t, NEST_API_BASE_URL } from '../base';
import { requestJson } from '../request';
import {
  replaceTaxonomyLinksInput,
  taxonomyCategoryLinkListSchema,
  taxonomyLinksQueryInput,
} from '../schemas';

// The owner segment is constrained to 'rooms' | 'stages' by the input schema,
// so it is safe to interpolate straight into the path.
export const taxonomyLinkRoutes = {
  getTaxonomyLinks: t.procedure
    .input(taxonomyLinksQueryInput)
    .output(taxonomyCategoryLinkListSchema)
    .query(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/${input.owner}/${encodeURIComponent(input.ownerId)}/category-links`,
        init: {
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach category mapping service.',
        failureMessage: 'Category mapping service returned',
        invalidPayloadMessage: 'Category mapping payload is invalid.',
        schema: taxonomyCategoryLinkListSchema,
      }),
    ),
  replaceTaxonomyLinks: t.procedure
    .input(replaceTaxonomyLinksInput)
    .output(taxonomyCategoryLinkListSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/${input.owner}/${encodeURIComponent(input.ownerId)}/category-links`,
        init: {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            includes: input.includes,
            excludes: input.excludes ?? [],
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach category mapping service.',
        failureMessage: 'Saving the category mapping failed',
        invalidPayloadMessage: 'Category mapping response is invalid.',
        schema: taxonomyCategoryLinkListSchema,
      }),
    ),
};
