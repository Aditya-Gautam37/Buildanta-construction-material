import { t, NEST_API_BASE_URL } from '../base';
import { requestJson, requestOk } from '../request';
import {
  createSupplierInput,
  deleteSupplierInput,
  deleteSupplierResponseSchema,
  nestSupplierListSchema,
  nestSupplierSchema,
  updateSupplierInput,
} from '../schemas';

export const supplierRoutes = {
  getSuppliers: t.procedure.output(nestSupplierListSchema).query(async () =>
    requestJson({
      url: `${NEST_API_BASE_URL}/suppliers`,
      init: {
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach suppliers service.',
      failureMessage: 'Suppliers service returned',
      invalidPayloadMessage: 'Suppliers payload is invalid.',
      schema: nestSupplierListSchema,
    }),
  ),
  createSupplier: t.procedure
    .input(createSupplierInput)
    .output(nestSupplierSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/suppliers`,
        init: {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            contactInfo: input.contactInfo,
            email: input.email,
            address: input.address,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach suppliers service.',
        failureMessage: 'Supplier creation failed',
        invalidPayloadMessage: 'Create supplier payload is invalid.',
        schema: nestSupplierSchema,
      }),
    ),
  updateSupplier: t.procedure
    .input(updateSupplierInput)
    .output(nestSupplierSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/suppliers/${encodeURIComponent(input.id)}`,
        init: {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            Authorization: `bearer ${input.accessToken}`,
          },
          body: JSON.stringify({
            name: input.name,
            contactInfo: input.contactInfo,
            email: input.email,
            address: input.address,
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach suppliers service.',
        failureMessage: 'Supplier update failed',
        invalidPayloadMessage: 'Update supplier payload is invalid.',
        schema: nestSupplierSchema,
      }),
    ),
  deleteSupplier: t.procedure
    .input(deleteSupplierInput)
    .output(deleteSupplierResponseSchema)
    .mutation(async ({ input }) => {
      await requestOk({
        url: `${NEST_API_BASE_URL}/suppliers/${encodeURIComponent(input.id)}`,
        init: {
          method: 'DELETE',
          headers: {
            Authorization: `bearer ${input.accessToken}`,
          },
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach suppliers service.',
        failureMessage: 'Supplier delete failed',
      });

      return { success: true };
    }),
};
