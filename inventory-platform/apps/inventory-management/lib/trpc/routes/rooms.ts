import { t, NEST_API_BASE_URL } from '../base';
import { requestJson, requestOk } from '../request';
import {
  createRoomInput,
  deleteRoomInput,
  deleteRoomResponseSchema,
  nestRoomListSchema,
  nestRoomSchema,
  updateRoomInput,
} from '../schemas';

export const roomRoutes = {
  getRooms: t.procedure.output(nestRoomListSchema).query(async () =>
    requestJson({
      url: `${NEST_API_BASE_URL}/rooms`,
      init: {
        cache: 'no-store',
      },
      unreachableMessage: 'Unable to reach rooms service.',
      failureMessage: 'Rooms service returned',
      invalidPayloadMessage: 'Rooms payload is invalid.',
      schema: nestRoomListSchema,
    }),
  ),
  createRoom: t.procedure
    .input(createRoomInput)
    .output(nestRoomSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/rooms`,
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
        unreachableMessage: 'Unable to reach rooms service.',
        failureMessage: 'Room creation failed',
        invalidPayloadMessage: 'Create room payload is invalid.',
        schema: nestRoomSchema,
      }),
    ),
  updateRoom: t.procedure
    .input(updateRoomInput)
    .output(nestRoomSchema)
    .mutation(async ({ input }) =>
      requestJson({
        url: `${NEST_API_BASE_URL}/rooms/${encodeURIComponent(input.id)}`,
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
        unreachableMessage: 'Unable to reach rooms service.',
        failureMessage: 'Room update failed',
        invalidPayloadMessage: 'Update room payload is invalid.',
        schema: nestRoomSchema,
      }),
    ),
  deleteRoom: t.procedure
    .input(deleteRoomInput)
    .output(deleteRoomResponseSchema)
    .mutation(async ({ input }) => {
      await requestOk({
        url: `${NEST_API_BASE_URL}/rooms/${encodeURIComponent(input.id)}`,
        init: {
          method: 'DELETE',
          headers: {
            Authorization: `bearer ${input.accessToken}`,
          },
          cache: 'no-store',
        },
        unreachableMessage: 'Unable to reach rooms service.',
        failureMessage: 'Room delete failed',
      });

      return { success: true };
    }),
};
