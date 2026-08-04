import { t, NEST_API_BASE_URL } from '../base';
import { requestJson, requestOk } from '../request';
import {
  createProductInput,
  createProductResponseSchema,
  deleteProductInput,
  deleteProductResponseSchema,
  inventoryProductsOutputSchema,
  nestProductListSchema,
  staffTokenInput,
  updateProductInput,
  updateProductResponseSchema,
} from '../schemas';
import { toInventoryProduct } from '../helpers';

export const productRoutes = {
  createProduct: t.procedure
    .input(createProductInput)
    .output(createProductResponseSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/products`,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            brandId: input.brandId,
            brand: input.brand,
            description: input.description,
            category: input.category,
            categoryIds: input.categoryIds,
            stageIds: input.stageIds,
            roomIds: input.roomIds,
            sku: input.sku,
            price: input.price,
            createDefaultVariant: input.createDefaultVariant,
            defaultVariant: input.defaultVariant,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach products service.',
        failureMessage: 'Product create failed',
        invalidPayloadMessage: 'Create product payload is invalid.',
        schema: createProductResponseSchema,
      }),
    ),
  getProducts: t.procedure.input(staffTokenInput).output(inventoryProductsOutputSchema).query(async ({ input }) => {
    const products = await requestJson({
      url: `${NEST_API_BASE_URL}/products/inventory/all`,
      init: {
        headers: { Authorization: `bearer ${input.accessToken}` },
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach products service.',
      failureMessage: 'Products service returned',
      invalidPayloadMessage: 'Products payload is invalid.',
      schema: nestProductListSchema,
    });

    return products.map(toInventoryProduct);
  }),
  updateProduct: t.procedure
    .input(updateProductInput)
    .output(updateProductResponseSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/products/${encodeURIComponent(input.id)}`,
        init: {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            brand: input.brand,
            brandId: input.brandId,
            description: input.description,
            categoryIds: input.categoryIds,
            stageIds: input.stageIds,
            roomIds: input.roomIds,
            price: input.price,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach products service.',
        failureMessage: 'Product update failed',
        invalidPayloadMessage: 'Update product payload is invalid.',
        schema: updateProductResponseSchema,
      }),
    ),
  deleteProduct: t.procedure
    .input(deleteProductInput)
    .output(deleteProductResponseSchema)
    .mutation(async ({ input }) => {
      await requestOk({
        url: `${NEST_API_BASE_URL}/products/${encodeURIComponent(input.id)}`,
        init: {
          method: 'DELETE',
          headers: {
            Authorization: `bearer ${input.accessToken}`,
          },
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach products service.',
        failureMessage: 'Product delete failed',
      });

      return { success: true };
    }),
};
