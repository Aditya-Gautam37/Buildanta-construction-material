import { t, NEST_API_BASE_URL } from '../base';
import { requestJson, requestOk } from '../request';
import {
  createStageInput,
  deleteStageInput,
  deleteStageResponseSchema,
  nestStageListSchema,
  nestStageSchema,
  updateStageInput,
} from '../schemas';

export const stageRoutes = {
  getStages: t.procedure.output(nestStageListSchema).query(async () =>
    requestJson({
      url: `${NEST_API_BASE_URL}/stages`,
      init: {
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach stages service.',
      failureMessage: 'Stages service returned',
      invalidPayloadMessage: 'Stages payload is invalid.',
      schema: nestStageListSchema,
    }),
  ),
  createStage: t.procedure
    .input(createStageInput)
    .output(nestStageSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/stages`,
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
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach stages service.',
        failureMessage: 'Stage creation failed',
        invalidPayloadMessage: 'Create stage payload is invalid.',
        schema: nestStageSchema,
      }),
    ),
  updateStage: t.procedure
    .input(updateStageInput)
    .output(nestStageSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/stages/${encodeURIComponent(input.id)}`,
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
          }),
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach stages service.',
        failureMessage: 'Stage update failed',
        invalidPayloadMessage: 'Update stage payload is invalid.',
        schema: nestStageSchema,
      }),
    ),
  deleteStage: t.procedure
    .input(deleteStageInput)
    .output(deleteStageResponseSchema)
    .mutation(async ({ input }) => {
      await requestOk({
        url: `${NEST_API_BASE_URL}/stages/${encodeURIComponent(input.id)}`,
        init: {
          method: 'DELETE',
          headers: {
            Authorization: `bearer ${input.accessToken}`,
          },
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach stages service.',
        failureMessage: 'Stage delete failed',
      });

      return { success: true };
    }),
};
