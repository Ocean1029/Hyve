/**
 * Generates OpenAPI components/schemas from Zod schemas.
 * Uses zod-to-json-schema to convert Zod definitions to OpenAPI 3.0 compatible JSON Schema.
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';
import {
  ErrorSchema,
  SuccessSchema,
  UserSchema,
  FocusSessionSchema,
  FriendApiSchema,
  GenerateChatResponseRequestSchema,
  GenerateChatResponseResponseSchema,
  GenerateTagsRequestSchema,
  GenerateTagsResponseSchema,
  GenerateIcebreakerRequestSchema,
  GenerateIcebreakerResponseSchema,
  UploadResponseSchema,
  PresenceStatusSchema,
  PresenceStatusResponseSchema,
  SessionStatusResponseSchema,
  PauseSessionRequestSchema,
  EndSessionRequestSchema,
  CreateSessionRequestSchema,
  SessionListItemSchema,
  ListSessionsResponseSchema,
  TodaySessionsResponseSchema,
  ActiveSessionsResponseSchema,
  SendFriendRequestSchema,
  PendingRequestItemSchema,
  PendingRequestsResponseSchema,
  CheckFriendRequestStatusResponseSchema,
  GetUsersStatusRequestSchema,
  PresenceMeResponseSchema,
  UserStatusItemSchema,
  UpdateLocationRequestSchema,
  NearbyUserItemSchema,
  NearbyUsersResponseSchema,
  CreateFriendRequestSchema,
  CheckFriendResponseSchema,
  SpringBloomEntrySchema,
  SpringBloomResponseSchema,
  CreateMemoryRequestSchema,
  AddPhotoToMemoryRequestSchema,
  CreateMemoryWithPhotoRequestSchema,
  UpdateMemoryWithPhotoRequestSchema,
  SendMessageRequestSchema,
  GetConversationResponseSchema,
  GetFriendFocusSessionsResponseSchema,
  SearchUsersResponseSchema,
  SearchFriendsResponseSchema,
  GetRecommendedUsersResponseSchema,
  UpdateUserProfileRequestSchema,
  UserStatsResponseSchema,
} from '@hyve/types';

/** Map of OpenAPI component name to Zod schema */
const SCHEMA_MAP: Record<string, z.ZodTypeAny> = {
  Error: ErrorSchema,
  Success: SuccessSchema,
  User: UserSchema,
  FocusSession: FocusSessionSchema,
  Friend: FriendApiSchema,
  GenerateChatResponseRequest: GenerateChatResponseRequestSchema,
  GenerateChatResponseResponse: GenerateChatResponseResponseSchema,
  GenerateTagsRequest: GenerateTagsRequestSchema,
  GenerateTagsResponse: GenerateTagsResponseSchema,
  GenerateIcebreakerRequest: GenerateIcebreakerRequestSchema,
  GenerateIcebreakerResponse: GenerateIcebreakerResponseSchema,
  UploadResponse: UploadResponseSchema,
  PresenceStatus: PresenceStatusSchema,
  PresenceStatusResponse: PresenceStatusResponseSchema,
  SessionStatusResponse: SessionStatusResponseSchema,
  PauseSessionRequest: PauseSessionRequestSchema,
  EndSessionRequest: EndSessionRequestSchema,
  CreateSessionRequest: CreateSessionRequestSchema,
  SessionListItem: SessionListItemSchema,
  ListSessionsResponse: ListSessionsResponseSchema,
  TodaySessionsResponse: TodaySessionsResponseSchema,
  ActiveSessionsResponse: ActiveSessionsResponseSchema,
  SendFriendRequest: SendFriendRequestSchema,
  PendingRequestItem: PendingRequestItemSchema,
  PendingRequestsResponse: PendingRequestsResponseSchema,
  CheckFriendRequestStatusResponse: CheckFriendRequestStatusResponseSchema,
  GetUsersStatusRequest: GetUsersStatusRequestSchema,
  PresenceMeResponse: PresenceMeResponseSchema,
  UserStatusItem: UserStatusItemSchema,
  UpdateLocationRequest: UpdateLocationRequestSchema,
  NearbyUserItem: NearbyUserItemSchema,
  NearbyUsersResponse: NearbyUsersResponseSchema,
  CreateFriendRequest: CreateFriendRequestSchema,
  CheckFriendResponse: CheckFriendResponseSchema,
  SpringBloomEntry: SpringBloomEntrySchema,
  SpringBloomResponse: SpringBloomResponseSchema,
  CreateMemoryRequest: CreateMemoryRequestSchema,
  AddPhotoToMemoryRequest: AddPhotoToMemoryRequestSchema,
  CreateMemoryWithPhotoRequest: CreateMemoryWithPhotoRequestSchema,
  UpdateMemoryWithPhotoRequest: UpdateMemoryWithPhotoRequestSchema,
  SendMessageRequest: SendMessageRequestSchema,
  GetConversationResponse: GetConversationResponseSchema,
  GetFriendFocusSessionsResponse: GetFriendFocusSessionsResponseSchema,
  SearchUsersResponse: SearchUsersResponseSchema,
  SearchFriendsResponse: SearchFriendsResponseSchema,
  GetRecommendedUsersResponse: GetRecommendedUsersResponseSchema,
  UpdateUserProfileRequest: UpdateUserProfileRequestSchema,
  UserStatsResponse: UserStatsResponseSchema,
};

/** Recursively replace #/definitions/ with #/components/schemas/ in schema object */
function rewriteRefs(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return obj.replace(/#\/definitions\//g, '#/components/schemas/');
  }
  if (Array.isArray(obj)) {
    return obj.map(rewriteRefs);
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '$ref' && typeof value === 'string') {
        result[key] = value.replace(/#\/definitions\//g, '#/components/schemas/');
      } else {
        result[key] = rewriteRefs(value);
      }
    }
    return result;
  }
  return obj;
}

/** Build OpenAPI components.schemas from Zod schemas */
function buildOpenApiSchemas(): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  for (const [name, schema] of Object.entries(SCHEMA_MAP)) {
    // zodToJsonSchema has deep generics that cause TS "excessively deep" error with our schema map
    // @ts-expect-error Type instantiation is excessively deep and possibly infinite
    const result = zodToJsonSchema(schema, {
      name,
      target: 'openApi3',
      $refStrategy: 'none',
    });

    const resultObj = result as { $ref?: string; definitions?: Record<string, unknown> };
    const definitions = resultObj.definitions;
    if (definitions && typeof definitions === 'object') {
      for (const [defName, defSchema] of Object.entries(definitions)) {
        if (defSchema && !merged[defName]) {
          merged[defName] = rewriteRefs(defSchema);
        }
      }
    }

    // Also extract the main schema if it's at top level
    if (resultObj.$ref && definitions?.[name]) {
      merged[name] = rewriteRefs(definitions[name]);
    }
  }

  return merged;
}

export const openApiSchemas = buildOpenApiSchemas();
