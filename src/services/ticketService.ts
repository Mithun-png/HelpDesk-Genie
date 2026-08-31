import { INITIAL_TICKETS } from '../data/initialTickets';
import { Ticket, PlatformType, TicketPriority, TicketStatus, UserRole } from '../types';

export class TicketService {
  private tickets: Ticket[] = [...INITIAL_TICKETS];
  private nextJiraNum = 104;

  public getAllTickets(): Ticket[] {
    return this.tickets;
  }

  public getTicketsForUser(userEmail: string, role: UserRole): Ticket[] {
    if (role === 'it_admin' || role === 'agent' || role === 'approver') {
      return this.tickets;
    }
    const norm = userEmail.toLowerCase().trim();
    return this.tickets.filter(t => t.createdBy.toLowerCase() === norm);
  }

  public getTicketById(id: string): Ticket | undefined {
    return this.tickets.find(t => t.id.toLowerCase() === id.toLowerCase());
  }

  public createTicket(params: {
    platform?: PlatformType;
    title: string;
    description: string;
    priority?: TicketPriority;
    category?: string;
    createdBy: string;
    createdByName?: string;
    approverId?: string;
    conversationId?: string;
  }): Ticket {
    const platform = params.platform || (params.title.toLowerCase().includes('access') ? 'ServiceNow' : 'JIRA');
    let newId: string;
    if (platform === 'JIRA') {
      newId = `KAN-${this.nextJiraNum++}`;
    } else {
      newId = `INC00${Math.floor(89200 + Math.random() * 800)}`;
    }

    const newTicket: Ticket = {
      id: newId,
      platform,
      title: params.title,
      description: params.description,
      status: params.approverId ? 'Pending Approval' : 'Open',
      priority: params.priority || 'Medium',
      category: params.category || 'General IT',
      createdBy: params.createdBy,
      createdByName: params.createdByName || params.createdBy.split('@')[0],
      assignedTo: platform === 'JIRA' ? 'elena.rostova@corp.internal' : 'HelpDeskGenie-Automated',
      approverId: params.approverId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversationId: params.conversationId
    };

    this.tickets.unshift(newTicket);
    return newTicket;
  }

  public escalateTicket(id: string, priority: TicketPriority = 'Urgent', reason?: string): { success: boolean; ticket?: Ticket; message: string } {
    const ticket = this.getTicketById(id);
    if (!ticket) {
      return { success: false, message: `Ticket ${id} not found in JIRA/ServiceNow systems.` };
    }

    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();
    if (reason) {
      ticket.metadata = { ...ticket.metadata, escalationReason: reason };
    }

    return {
      success: true,
      ticket,
      message: `Ticket ${ticket.id} has been escalated to priority "${priority}". The on-call Tier 2 engineering queue has been notified.`
    };
  }

  public closeTicket(id: string, resolutionNotes: string): { success: boolean; ticket?: Ticket; message: string } {
    const ticket = this.getTicketById(id);
    if (!ticket) {
      return { success: false, message: `Ticket ${id} not found.` };
    }

    ticket.status = 'Resolved';
    ticket.resolutionNotes = resolutionNotes;
    ticket.updatedAt = new Date().toISOString();

    return {
      success: true,
      ticket,
      message: `Ticket ${ticket.id} has been resolved and closed successfully.`
    };
  }

  public updateTicketStatus(id: string, status: TicketStatus): Ticket | undefined {
    const ticket = this.getTicketById(id);
    if (ticket) {
      ticket.status = status;
      ticket.updatedAt = new Date().toISOString();
    }
    return ticket;
  }
}

export const ticketService = new TicketService();
