import { t, NEST_API_BASE_URL } from '../base';
import { requestJson } from '../request';
import {
  createProductVariantInput,
  nestProductVariantListSchema,
  nestProductVariantSchema,
  staffTokenInput,
  updateProductVariantInput,
} from '../schemas';

export const variantRoutes = {
  getProductVariants: t.procedure.input(staffTokenInput).output(nestProductVariantListSchema).query(async ({ input }) =>
    requestJson({
      url: `${NEST_API_BASE_URL}/product-variants/inventory/all`,
      init: {
        headers: { Authorization: `bearer ${input.accessToken}` },
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach product variants service.',
      failureMessage: 'Product variants service returned',
      invalidPayloadMessage: 'Product variants payload is invalid.',
      schema: nestProductVariantListSchema,
    }),
  ),
  createProductVariant: t.procedure
    .input(createProductVariantInput)
    .output(nestProductVariantSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/product-variants`,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            productId: input.productId,
            supplierId: input.supplierId,
            sku: input.sku,
            price: input.price,
            attributes: input.attributes,
            imageUrls: input.imageUrls,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach product variants service.',
        failureMessage: 'Product variant creation failed',
        invalidPayloadMessage: 'Create product variant payload is invalid.',
        schema: nestProductVariantSchema,
      }),
    ),
  updateProductVariant: t.procedure
    .input(updateProductVariantInput)
    .output(nestProductVariantSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/product-variants/${encodeURIComponent(input.id)}`,
        init: {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            productId: input.productId,
            supplierId: input.supplierId,
            sku: input.sku,
            price: input.price,
            attributes: input.attributes,
            imageUrls: input.imageUrls,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach product variants service.',
        failureMessage: 'Product variant update failed',
        invalidPayloadMessage: 'Update product variant payload is invalid.',
        schema: nestProductVariantSchema,
      }),
    ),
};
