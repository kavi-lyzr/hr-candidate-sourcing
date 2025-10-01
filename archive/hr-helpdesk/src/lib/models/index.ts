// Export all models from a single entry point
export { default as User, type IUser } from './User';
export { default as Organization, type IOrganization } from './Organization';
export { default as OrganizationUser, type IOrganizationUser, type UserRole } from './OrganizationUser';
export { default as Department, type IDepartment } from './Department';
export { default as Ticket, type ITicket, type TicketStatus, type TicketPriority } from './Ticket';
export { default as TicketMessage, type ITicketMessage, type MessageRole } from './TicketMessage';
export { default as KnowledgeBase, type IKnowledgeBase, type FileType } from './KnowledgeBase';
