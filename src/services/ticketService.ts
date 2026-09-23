import { INITIAL_TICKETS } from '../data/initialTickets';
import { Ticket, PlatformType, TicketPriority, TicketStatus, UserRole } from '../types';

export class TicketService {
  private tickets: Ticket[] = [...INITIAL_TICKETS];
  private nextJiraNum = 104;
  private jiraBaseUrl: string;
  private serviceNowBaseUrl: string;

  constructor() {
    const envJira = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_JIRA_INSTANCE_URL) || '';
    const storedJira = typeof localStorage !== 'undefined' ? localStorage.getItem('helpdeskgenie_jira_url') : null;
    const resolvedJira = storedJira || (envJira && !envJira.includes('your-domain') ? envJira : 'https://smithunpillai-1787661457265.atlassian.net');
    this.jiraBaseUrl = resolvedJira.replace(/\/$/, '');

    const envSN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVICENOW_INSTANCE) || '';
    const storedSN = typeof localStorage !== 'undefined' ? localStorage.getItem('helpdeskgenie_sn_url') : null;
    const resolvedSN = storedSN || (envSN ? `https://${envSN.replace(/^https?:\/\//, '')}` : 'https://dev354821.service-now.com');
    this.serviceNowBaseUrl = resolvedSN.replace(/\/$/, '');

    // Populate externalUrl for initial tickets
    this.tickets = this.tickets.map(t => ({
      ...t,
      externalUrl: this.getExternalUrl(t.platform, t.id),
      serviceDeskUrl: `#ticket-${t.id}`
    }));
  }

  public setJiraBaseUrl(url: string) {
    this.jiraBaseUrl = url.replace(/\/$/, '');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('helpdeskgenie_jira_url', this.jiraBaseUrl);
    }
    this.tickets = this.tickets.map(t => ({
      ...t,
      externalUrl: this.getExternalUrl(t.platform, t.id)
    }));
  }

  public setServiceNowBaseUrl(url: string) {
    this.serviceNowBaseUrl = url.replace(/\/$/, '');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('helpdeskgenie_sn_url', this.serviceNowBaseUrl);
    }
    this.tickets = this.tickets.map(t => ({
      ...t,
      externalUrl: this.getExternalUrl(t.platform, t.id)
    }));
  }

  public getJiraBaseUrl(): string {
    return this.jiraBaseUrl;
  }

  public getJiraBoardUrl(): string {
    return `${this.jiraBaseUrl}/browse/KAN`;
  }

  public getJiraProjectsUrl(): string {
    return `${this.jiraBaseUrl}/jira/projects`;
  }

  public getServiceNowBaseUrl(): string {
    return this.serviceNowBaseUrl;
  }

  public getExternalUrl(platform: PlatformType, _id: string): string {
    if (platform === 'JIRA') {
      return `${this.jiraBaseUrl}/browse/KAN`;
    }
    return `${this.serviceNowBaseUrl}/nav_to.do?uri=incident.do?sys_id=${_id}`;
  }

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
      conversationId: params.conversationId,
      externalUrl: this.getExternalUrl(platform, newId),
      serviceDeskUrl: `#ticket-${newId}`
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
