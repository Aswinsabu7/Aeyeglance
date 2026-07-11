export type TicketStatus   = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketCategory = 'bug' | 'feature' | 'support' | 'inquiry';

export interface Ticket {
  id:          number;
  ticketId:    string;
  title:       string;
  description: string;
  status:      TicketStatus;
  priority:    TicketPriority;
  category:    TicketCategory;
  assignee:    string;
  reporter:    string;
  tags:        string[];
  createdAt:   string;
  updatedAt:   string;
}

export interface TicketListResponse {
  tickets:    Ticket[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface TicketFilters {
  search:   string;
  status:   TicketStatus | '';
  priority: TicketPriority | '';
  category: TicketCategory | '';
}

export interface AiAnalysis {
  summary:       string;
  nextStep:      string;
  suggestions:   string[];
  estimatedTime: string;
}

export interface AiMessage {
  role:    'user' | 'assistant';
  content: string;
  loading?: boolean;
}
