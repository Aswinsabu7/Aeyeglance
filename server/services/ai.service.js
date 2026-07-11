'use strict';

/**
 * Mock AI assistant responses for the ticket dashboard.
 * In production this would call an actual LLM API.
 */

const SUGGESTIONS_BY_CATEGORY = {
  bug: [
    'Check browser console for JavaScript errors.',
    'Reproduce the issue in a private/incognito window to rule out cache issues.',
    'Verify the API is returning the expected response using Network DevTools.',
    'Check if the bug exists in production vs staging environments.',
    'Look for recent commits that may have introduced a regression.'
  ],
  feature: [
    'Break this feature into smaller, incremental tasks.',
    'Write the API contract (endpoints + payloads) before implementation.',
    'Discuss edge cases and error states with the team before coding.',
    'Add feature flags so it can be deployed without being immediately visible.',
    'Include accessibility (keyboard navigation, ARIA) in the acceptance criteria.'
  ],
  support: [
    'Check the server logs for the relevant time window.',
    'Verify environment variables and configuration files are correct.',
    'Test with a fresh user account to isolate account-specific issues.',
    'Review recent infrastructure or deployment changes.',
    'Check for rate-limit or quota issues on third-party integrations.'
  ],
  inquiry: [
    'Review the existing documentation first.',
    'Check if there is an existing issue or PR that addresses this.',
    'Identify the affected component and responsible team.',
    'Clarify the expected vs actual behaviour before investigating.',
    'Add findings to the documentation to help future inquiries.'
  ]
};

const PRIORITY_ADVICE = {
  critical: 'This is a CRITICAL ticket — assign immediately and update every 4 hours.',
  high:     'HIGH priority — schedule for the current sprint and escalate if blocked.',
  medium:   'MEDIUM priority — include in next sprint planning.',
  low:      'LOW priority — backlog candidate; re-evaluate in next quarter review.'
};

const STATUS_TRANSITIONS = {
  open:        'Recommended next step: assign to a developer and move to "in-progress".',
  'in-progress': 'Recommended next step: complete work and move to "resolved" with a resolution note.',
  resolved:    'Recommended next step: verify fix with reporter, then close the ticket.',
  closed:      'This ticket is closed. Re-open only if the issue recurs.'
};

/**
 * Generates a mock AI analysis for a single ticket.
 */
function analyzeTicket(ticket) {
  const suggestions = (SUGGESTIONS_BY_CATEGORY[ticket.category] || SUGGESTIONS_BY_CATEGORY.support)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return {
    summary:       `This is a ${ticket.priority} priority ${ticket.category} ticket. ${PRIORITY_ADVICE[ticket.priority] || ''}`,
    nextStep:      STATUS_TRANSITIONS[ticket.status] || '',
    suggestions,
    estimatedTime: ticket.priority === 'critical' ? '1-2 hours'
                 : ticket.priority === 'high'     ? '4-8 hours'
                 : ticket.priority === 'medium'   ? '1-2 days'
                 : '1 week'
  };
}

/**
 * Answers a free-text question about a ticket using mock logic.
 */
function answerQuestion(ticket, question) {
  const q = question.toLowerCase();

  if (q.includes('assign') || q.includes('who')) {
    return ticket.assignee
      ? `This ticket is currently assigned to **${ticket.assignee}**.`
      : 'This ticket is currently unassigned. Consider assigning it to a team member.';
  }

  if (q.includes('priority') || q.includes('urgent')) {
    return `The ticket has **${ticket.priority}** priority. ${PRIORITY_ADVICE[ticket.priority] || ''}`;
  }

  if (q.includes('status') || q.includes('progress')) {
    return `Current status is **${ticket.status}**. ${STATUS_TRANSITIONS[ticket.status] || ''}`;
  }

  if (q.includes('fix') || q.includes('solve') || q.includes('resolve') || q.includes('how')) {
    const suggestions = (SUGGESTIONS_BY_CATEGORY[ticket.category] || SUGGESTIONS_BY_CATEGORY.support)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    return `Here are some suggestions to address this ${ticket.category}:\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  if (q.includes('tag') || q.includes('label')) {
    return ticket.tags.length
      ? `This ticket is tagged with: ${ticket.tags.map(t => `**${t}**`).join(', ')}.`
      : 'No tags have been assigned to this ticket yet.';
  }

  if (q.includes('time') || q.includes('estimate') || q.includes('long')) {
    const time = ticket.priority === 'critical' ? '1-2 hours'
               : ticket.priority === 'high'     ? '4-8 hours'
               : ticket.priority === 'medium'   ? '1-2 days'
               : '1 week';
    return `Based on priority (${ticket.priority}), estimated time to resolve: **${time}**.`;
  }

  if (q.includes('similar') || q.includes('related')) {
    return `To find related tickets, search for the following tags: ${ticket.tags.map(t => `**${t}**`).join(', ')}.`;
  }

  // Fallback generic response
  const analysis = analyzeTicket(ticket);
  return `**Summary:** ${analysis.summary}\n\n**Next Step:** ${analysis.nextStep}\n\n**Suggestions:**\n${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

module.exports = { analyzeTicket, answerQuestion };
