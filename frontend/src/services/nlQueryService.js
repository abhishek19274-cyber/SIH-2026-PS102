/**
 * Natural Language Query Service
 * Connects to /api/nl_query/
 */
import { post } from "./api";

export async function runNaturalLanguageQuery(payload) {
  return post("/api/nl_query/", payload);
}

export const nlQueryService = {
  runNaturalLanguageQuery,
};

export default nlQueryService;
