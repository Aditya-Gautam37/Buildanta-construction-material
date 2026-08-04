import { t, NEST_API_BASE_URL } from '../base';
import { requestJson, requestOk } from '../request';
import {
  createBrandInput,
  deleteBrandInput,
  deleteBrandResponseSchema,
  nestBrandListSchema,
  nestBrandSchema,
  updateBrandInput,
} from '../schemas';

export const brandRoutes = {
  getBrands: t.procedure.output(nestBrandListSchema).query(async () =>
    requestJson({
      url: `${NEST_API_BASE_URL}/brands`,
      init: {
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach brands service.',
      failureMessage: 'Brands service returned',
      invalidPayloadMessage: 'Brands payload is invalid.',
      schema: nestBrandListSchema,
    }),
  ),
  createBrand: t.procedure
    .input(createBrandInput)
    .output(nestBrandSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/brands`,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            slug: input.slug,
            logo: input.logo,
            description: input.description,
            website: input.website,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach brands service.',
        failureMessage: 'Brand creation failed',
        invalidPayloadMessage: 'Create brand payload is invalid.',
        schema: nestBrandSchema,
      }),
    ),
  updateBrand: t.procedure
    .input(updateBrandInput)
    .output(nestBrandSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/brands/${encodeURIComponent(input.id)}`,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            slug: input.slug,
            logo: input.logo,
            description: input.description,
            website: input.website,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach brands service.',
        failureMessage: 'Brand update failed',
        invalidPayloadMessage: 'Update brand payload is invalid.',
        schema: nestBrandSchema,
      }),
    ),
  deleteBrand: t.procedure
    .input(deleteBrandInput)
    .output(deleteBrandResponseSchema)
    .mutation(async ({ input }) => {
      await requestOk({
        url: `${NEST_API_BASE_URL}/brands/${encodeURIComponent(input.id)}/delete`,
        init: {
          method: 'POST',
          headers: {
            Authorization: `bearer ${input.accessToken}`,
          },
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach brands service.',
        failureMessage: 'Brand delete failed',
      });

      return { success: true };
    }),
};
