import { t, NEST_API_BASE_URL } from '../base';
import { requestJson, requestOk } from '../request';
import {
  createCategoryInput,
  deleteCategoryInput,
  deleteCategoryResponseSchema,
  nestCategoryListSchema,
  nestCategorySchema,
  updateCategoryInput,
} from '../schemas';
import { z } from 'zod';

export const categoryRoutes = {
  getCategories: t.procedure.output(nestCategoryListSchema).query(async () =>
    requestJson({
      url: `${NEST_API_BASE_URL}/categories`,
      init: {
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach categories service.',
      failureMessage: 'Categories service returned',
      invalidPayloadMessage: 'Categories payload is invalid.',
      schema: nestCategoryListSchema,
    }),
  ),
  getInventoryCategories: t.procedure
    .input(z.object({ accessToken: z.string().trim().min(1) }))
    .output(nestCategoryListSchema)
    .query(async ({ input }) => requestJson({
      url: `${NEST_API_BASE_URL}/categories/inventory/all`,
      init: {
        headers: { Authorization: `bearer ${input.accessToken}` },
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach categories service.',
      failureMessage: 'Categories service returned',
      invalidPayloadMessage: 'Inventory categories payload is invalid.',
      schema: nestCategoryListSchema,
    })),
  createCategory: t.procedure
    .input(createCategoryInput)
    .output(nestCategorySchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/categories`,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            slug: input.slug,
            parentId: input.parentId,
            description: input.description,
            imageUrl: input.imageUrl,
            icon: input.icon,
            sortOrder: input.sortOrder,
            featured: input.featured,
            published: input.published,
            seoTitle: input.seoTitle,
            seoDescription: input.seoDescription,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach categories service.',
        failureMessage: 'Category creation failed',
        invalidPayloadMessage: 'Create category payload is invalid.',
        schema: nestCategorySchema,
      }),
    ),
  updateCategory: t.procedure
    .input(updateCategoryInput)
    .output(nestCategorySchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/categories/${encodeURIComponent(input.id)}`,
        init: {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            slug: input.slug,
            parentId: input.parentId,
            description: input.description,
            imageUrl: input.imageUrl,
            icon: input.icon,
            sortOrder: input.sortOrder,
            featured: input.featured,
            published: input.published,
            seoTitle: input.seoTitle,
            seoDescription: input.seoDescription,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach categories service.',
        failureMessage: 'Category update failed',
        invalidPayloadMessage: 'Update category payload is invalid.',
        schema: nestCategorySchema,
      }),
    ),
  deleteCategory: t.procedure
    .input(deleteCategoryInput)
    .output(deleteCategoryResponseSchema)
    .mutation(async ({ input }) => {
      await requestOk({
        url: `${NEST_API_BASE_URL}/categories/${encodeURIComponent(input.id)}`,
        init: {
          method: 'DELETE',
          headers: {
            Authorization: `bearer ${input.accessToken}`,
          },
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach categories service.',
        failureMessage: 'Category delete failed',
      });

      return { success: true };
    }),
};
