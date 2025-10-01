import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAgentVersion {
  agentType: 'sourcing' | 'matching';
  version: string;
  name: string;
  description: string;
  system_prompt: string;
  tools: string[]; // This will store tool *names* or *IDs* required by this agent version
  llmModel: string;
  provider_id: string;
  llm_credential_id: string;
  temperature: number;
  top_p: number;
}

export interface IAgentVersionDocument extends IAgentVersion, Document {
  _id: Types.ObjectId;
}

const AgentVersionSchema: Schema<IAgentVersionDocument> = new Schema<IAgentVersionDocument>(
  {
    agentType: { type: String, required: true, enum: ['sourcing', 'matching'] },
    version: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    system_prompt: { type: String, required: true },
    tools: [{ type: String }],
    llmModel: { type: String, default: 'gpt-4o-mini' },
    provider_id: { type: String, default: 'openai' },
    llm_credential_id: { type: String, default: 'lyzr_openai' },
    temperature: { type: Number, default: 0.2 },
    top_p: { type: Number, default: 1 },
  },
  { timestamps: true }
);

AgentVersionSchema.index({ agentType: 1, version: 1 }, { unique: true });

if (mongoose.models.AgentVersion) {
  delete mongoose.models.AgentVersion;
}

export default mongoose.model<IAgentVersionDocument>('AgentVersion', AgentVersionSchema);
