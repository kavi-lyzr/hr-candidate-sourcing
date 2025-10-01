# Debug Lyzr API Calls

## 1. Test RAG (Knowledge Base) Creation

Based on the [Lyzr RAG API documentation](https://docs.lyzr.ai/agent-lab/knowledgebase/api/Create%20RAG):

```bash
curl --request POST \
  --url https://rag-prod.studio.lyzr.ai/v3/rag/ \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: YOUR_API_KEY_HERE' \
  --data '{
    "user_id": "YOUR_USER_ID",
    "llm_credential_id": "lyzr_google",
    "embedding_credential_id": "lyzr_openai", 
    "vector_db_credential_id": "lyzr_qdrant",
    "description": "HR Helpdesk Knowledge Base for Test Org",
    "collection_name": "hr_helpdesk_test_org",
    "llm_model": "gemini/gemini-2.0-flash-exp",
    "embedding_model": "text-embedding-3-small",
    "vector_store_provider": "qdrant",
    "semantic_data_model": false,
    "meta_data": {}
  }'
```

Expected Response:
```json
{
  "id": "rag_id_here",
  "user_id": "your_user_id",
  "collection_name": "hr_helpdesk_test_org",
  ...
}
```

## 2. Test Tool Creation

Based on [Lyzr Tools API documentation](https://docs.lyzr.ai/agent-lab/tools/api/Create%20OpenAPI%20Tool%20Endpoint):

```bash
curl --request POST \
  --url https://agent-prod.studio.lyzr.ai/v3/tools/ \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: YOUR_API_KEY_HERE' \
  --data '{
    "tool_set_name": "hr_helpdesk_test_org",
    "openapi_schema": {
      "openapi": "3.0.0",
      "info": {
        "title": "HR Helpdesk Tools - Test Org",
        "version": "1.0.0"
      },
      "servers": [
        {
          "url": "http://localhost:3000",
          "description": "HR Helpdesk API Server"
        }
      ],
      "paths": {
        "/api/tools/raise_ticket": {
          "post": {
            "summary": "Create a new support ticket",
            "operationId": "raiseTicket"
          }
        }
      }
    },
    "default_headers": {},
    "default_query_params": {},
    "default_body_params": {},
    "endpoint_defaults": {},
    "enhance_descriptions": false,
    "openai_api_key": null
  }'
```

Expected Response:
```json
{
  "tool_ids": ["tool_id_1", "tool_id_2", "tool_id_3"]
}
```

## 3. Test Agent Creation

```bash
curl --request POST \
  --url https://agent-prod.studio.lyzr.ai/v3/agents/ \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: YOUR_API_KEY_HERE' \
  --data '{
    "name": "HR Helpdesk AI - Test Org",
    "description": "A friendly HR Assistant",
    "agent_role": "You are an Expert HR Assistant",
    "agent_instructions": "You are an AI HR Assistant for {{ organization_name }}...",
    "features": [
      {
        "type": "KNOWLEDGE_BASE",
        "config": {
          "lyzr_rag": {
            "base_url": "https://rag-prod.studio.lyzr.ai",
            "rag_id": "YOUR_RAG_ID_FROM_STEP_1",
            "rag_name": "hr_helpdesk_test_org"
          }
        }
      }
    ],
    "tools": ["YOUR_TOOL_IDS_FROM_STEP_2"]
  }'
```

## Debugging Steps

1. **Check API Key**: Make sure your Lyzr API key is valid and has the right permissions
2. **Check User ID**: Ensure you're using a valid Lyzr user ID
3. **Test Each Step**: Run the above curl commands one by one to isolate issues
4. **Check Console Logs**: Look for detailed error messages in the console

## Common Issues

- **Invalid credentials**: Check if `lyzr_google`, `lyzr_openai`, `lyzr_qdrant` credential IDs exist
- **User ID mismatch**: Make sure the user_id belongs to your organization
- **API Key encryption**: Verify the API key is being decrypted correctly

## Check What's in Database

After running these tests, check your MongoDB organization document:
- `lyzrKnowledgeBaseId` should contain the RAG ID
- `lyzrToolIds` should contain array of tool IDs  
- `lyzrAgentId` should contain the agent ID
