export const tools = {
    "openapi": "3.0.0",
    "info": {
      "title": "Helpdesk Ticket Management API",
      "version": "1.0.0",
      "description": "A unified API for managing support tickets. It allows creating, editing, and retrieving tickets for the HR Helpdesk system."
    },
    "servers": [
      {
        "url": "https://hr-helpdesk-ai.vercel.app/",
        "description": "Production Server"
      }
    ],
    "paths": {
      "/api/tools/raise_ticket": {
        "post": {
          "summary": "Create or raise a new support ticket",
          "description": "Use this tool to create a new support ticket when a user reports an issue. Only description & user_token are required - priority defaults to 'medium' and department can be auto-assigned or left unassigned. After creating the ticket let the user know about the tracking number of the ticket (not the id)",
          "operationId": "raiseTicket",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "description",
                    "user_token"
                  ],
                  "properties": {
                    "description": {
                      "type": "string",
                      "description": "A detailed description of the user's issue or request."
                    },
                    "priority": {
                      "type": "string",
                      "description": "The priority level of the ticket. Optional - defaults to 'medium'. Examples: 'low', 'medium', 'high', 'urgent'."
                    },
                    "department": {
                      "type": "string",
                      "description": "The department the ticket is for. Optional - can be left empty for unassigned tickets. Use department names like 'IT', 'HR', 'Finance', etc."
                    },
                    "user_token": {
                      "type": "string",
                      "description": "The user token identifying the current user. This is REQUIRED for all tool calls."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Ticket created successfully."
            },
            "400": {
              "description": "Bad request due to missing required fields."
            }
          }
        }
      },
      "/api/tools/edit_ticket": {
        "post": {
          "summary": "Update an existing support ticket",
          "description": "Use this tool to modify or update an existing ticket's details. You must provide the ticket_id. All other fields like description, category, priority, department, or status are optional and will only be updated if provided.",
          "operationId": "editTicket",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "ticket_id",
                    "user_token"
                  ],
                  "properties": {
                    "ticket_id": {
                      "type": "string",
                      "description": "The unique ID of the ticket to be updated."
                    },
                    "description": {
                      "type": "string",
                      "description": "The new, updated description for the ticket."
                    },
                    "priority": {
                      "type": "string",
                      "description": "The new priority level for the ticket."
                    },
                    "department": {
                      "type": "string",
                      "description": "The new department for the ticket. IMPORTANT: Only use department names that are provided in the system context."
                    },
                    "status": {
                      "type": "string",
                      "description": "The new status for the ticket. Examples: 'open', 'in_progress', 'closed'."
                    },
                    "user_token": {
                      "type": "string",
                      "description": "The user token identifying the current user. This is REQUIRED for all tool calls."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Ticket updated successfully."
            },
            "400": {
              "description": "Bad request due to missing ticket_id."
            },
            "404": {
              "description": "Ticket not found with the provided ticket_id."
            }
          }
        }
      },
      "/api/tools/get_ticket": {
        "post": {
          "summary": "Get a list of all support tickets",
          "description": "Use this tool to fetch a list of all recently created support tickets. Requires user_token parameter.",
          "operationId": "getTickets",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": [
                    "user_token"
                  ],
                  "properties": {
                    "user_token": {
                      "type": "string",
                      "description": "The user token identifying the current user. This is REQUIRED for all tool calls."
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully retrieved tickets."
            },
            "500": {
              "description": "Failed to fetch tickets."
            }
          }
        }
      }
    }
  }
  