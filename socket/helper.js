const { appURL, ProjectName } = require("../utils/labelUtils");

const chatbotResponse = {
  CHAT_BEGINNING: 'Starting chat',
  NEW_CONNECTION: 'New Connection',
  BOT_NAME: 'Demo bot',
  BOT_INTRO: (
    userName
  ) => `<p>👋 ${greetBasedOnTime()} <strong>${userName}</strong>!,</p>
  
  <p> Welcome to Chatbot!</p>
  
  </p>I'm here to assist you with various HR-related inquiries and tasks. To ensure a smooth experience, I've designed a menu-driven system that allows you to navigate through different options effortlessly.</p>
  
  <p>Here are some things I can help you with:</p>
  <ol>
  <li> <b>Leave Requests:</b> Submit, track, or inquire about your leave requests.</li>
  <li> <b>Expense Requests:</b> Submit, track, or inquire about your expense requests.</li>
  <li> <b>Events for a Specific Month:</b> View birthdays, work anniversaries, and holidays for a particular month.</li>
  </ol>
  <p>Simply type the corresponding number or keyword related to your query, and I'll guide you through the available options.</p><p>If you want to exit then type "exit".</p><p>Let's get started! How can I assist you today?</p>`,
  BOT_INTRO_2: 'Bot is testing',
  leave: `
    <p>Welcome to the Leave Requests section. Here are the available options to manage your leave requests:</p>
    <ol>
      <li><strong><a href=${appURL}#/app/attendances/add_employeeLeave">Submit a New Leave Request</a>:</strong> To apply for a new leave, choose this option to start the leave application process.</li>
      <li><strong><a href="${appURL}#/app/attendances/employeeLeave">List all Leave Requests</a>:</strong> To inquire about the status of your submitted leave requests, select this option.</li>
      <li><strong><a href="${appURL}#/app/attendances/my_leave_balance">Leave Balances</a>:</strong> Get information about your remaining leave balances by choosing this option.</li>
    </ol>
    <p>Simply type the corresponding number or keyword related to your query, and I'll guide you through the available options. For any further assistance or if you'd like to return to the main menu, type "back" or select the appropriate option.</p>`,
  expense: `
    <p>Welcome to the Expense Requests section. Here are the available options to manage your expense requests:</p>
    <ol>
      <li><strong><a href="${appURL}#/app/finances/add_expense">Submit a New Expense Request</a>:</strong> To apply for a new expense request, choose this option to start the expense application process.</li>
      <li><strong><a href="${appURL}#/app/finances/expense">List all Expense Requests</a>:</strong> To inquire about the status of your submitted expense requests, select this option.</li>
    </ol>
    <p>Simply type the corresponding number or keyword related to your query, and I'll guide you through the available options. For any further assistance or if you'd like to return to the main menu, type "back" or select the appropriate option.</p>`,
  events: `<h2>Welcome to the Events Section</h2>
    <p>Here are the available options to view events:</p>
    <ol>
      <li><strong>View Birthdays:</strong> See birthdays for a specific month.</li>
      <li><strong>View Work Anniversaries:</strong> Check work anniversaries for a specific month.</li>
      <li><strong>View Holidays:</strong> See holidays for current year.</li>
    </ol>
    <p>Simply type the corresponding number or keyword related to your query, and I'll guide you through the available options. For any further assistance or if you'd like to return to the main menu, type "back" or select the appropriate option.</p>`,
  invalidOption: 'Please enter a valid choice!',
  error: 'Something went wrong!',
  authenticationDenied:
    `Authentication Denied! Make sure you're logged into ${ProjectName}.`,
  eventResponse: (event) =>
    `<p>Please type the month (e.g., 1, 2, 3, ..., 11, 12) for which you want to view ${event}. For any further assistance or if you'd like to return to the main menu, type "back" or select the appropriate option.</p>`,
  addLeaveExpense: (event) =>
    `<p> To add a new request for ${event}, please click on <a href="${event === 'leaves'
      ? `${appURL}#/app/attendances/add_employeeLeave`
      : `${appURL}#/app/finances/add_expense`
    }">this link</a>.`,
};

const chatbotEvents = {
  FIRST_STEP: 'firstStep',
  LEAVES: 'leaves',
  EXPENSES: 'expenses',
  EVENTS: 'events',
  BIRTHDAYS: 'birthdays',
  WORK_ANNIVERSARIES: 'workAnniversaries',
  HOLIDAYS: 'holidays',
  BACK: 'back',
  ERROR: 'error',
  ADD_EXPENSE: 'addExpense',
  LIST_EXPENSE: 'listExpense',
  ADD_LEAVE: 'addLeave',
  LIST_LEAVE: 'listLeave',
  LEAVE_BALANCE: 'leaveBalance',
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 to month as it starts from 0
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfPreviousMonth = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  return formatDate(new Date(previousYear, previousMonth, 1));
};

const getEndOfNextMonth = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  return formatDate(new Date(nextYear, nextMonth + 1, 0));
};

const fetchLeaveStatus = (status) => {
  if (status === 0 || status === 1 || status === 2) return 'Pending';
  if (status === 3) return 'Approved';
  if (status === 4) return 'Rejected';
};
const fetchExpenseStatus = (data) => {
  if (data.Accept !== '') return 'Approved';
  if (data.Pending !== '') return 'Pending';
  if (data.reject !== '') return 'Rejected';
};

const emitBotEvent = (socket, message, event, childEvent) => {
  socket.emit('botEvent', { message, event, childEvent });
};

const handleBotError = (socket, error) => {
  console.log('Chatbot error:', error);
  socket.emit('botEvent', {
    message: chatbotResponse.error,
    event: chatbotEvents.ERROR,
    error,
  });
};

const generateEventListHTML = (data, eventType) => {
  let html = `<p>In the selected month, following people have their ${eventType}:</p><ol>`;
  data.forEach((element) => {
    html += `<li><strong>${element.displayName}</strong>: ${element.birthdayInWord || element['employeeJoiningDetails.joiningDate']
      }</li>`;
  });
  html +=
    '</ol><p>If you wish to go to previous menu type "back" or if you want to exit then type "exit".</p>';
  return html;
};

const generateHolidayListHTML = (holidays) => {
  let html = `<ol>`;
  Object.keys(holidays).forEach((h) => {
    Object.keys(holidays[h]).forEach((e) => {
      html += `<li><strong>${e}</strong>: ${holidays[h][e]}</li>`;
    });
  });
  html += `</ol> <p>If you wish to go to the previous menu, type "back". To exit, type "exit".</p>`;
  return html;
};

const generateLeavesListHTML = (leaves) => {
  if (!leaves.length)
    return '<p>No leave requests found for for previous month, current month, and next month.</p>';
  let res = `<h5>List of leaves applied for previous month, current month, and next month:</h5><ul>`;
  leaves.forEach((e) => {
    res += `<li>${e.DayType} ${e.hrLeaveType.LeaveMaster.LeaveName
      } leave from ${e.FromDate} to ${e.ToDate}: <strong>${fetchLeaveStatus(
        e.authorizationStatus
      )}</strong></li>`;
  });
  res += '</ul>';
  return res;
};

const generateLeaveBalanceHTML = (leaveBalance) => {
  let html = `<h5> Leave Balance:</h5><ul>`;
  leaveBalance.forEach((e) => {
    html += `<li><strong>${e.LeaveMaster.LeaveName}:</strong> ${e.status}</li>`;
  });
  html += `</ul>`;
  return html;
};

const generateExpensesListHTML = (expenses) => {
  if (!expenses.length)
    return '<p>No expense requests found for for previous month, current month, and next month.</p>';

  let res = `<h5>List of expenses applied for previous month, current month, and next month:</h5><ul>`;
  expenses.forEach((e) => {
    res += `<li>${e.expenseAmount}₹ "${e.expenseHead
      }" - type expense for date (${e.expense_date
      }): <strong>${fetchExpenseStatus(e)}</strong></li>`;
  });
  res += '</ul>';
  return res;
};

const greetBasedOnTime = () => {
  const currentHour = new Date().getHours();

  switch (true) {
    case currentHour >= 5 && currentHour < 12:
      return 'Good morning';
    case currentHour >= 12 && currentHour < 17:
      return 'Good afternoon';
    case currentHour >= 17 && currentHour < 21:
      return 'Good evening';
    default:
      return 'Good night';
  }
};

module.exports = {
  chatbotEvents,
  chatbotResponse,
  getStartOfPreviousMonth,
  getEndOfNextMonth,
  emitBotEvent,
  generateEventListHTML,
  handleBotError,
  generateHolidayListHTML,
  generateLeaveBalanceHTML,
  generateLeavesListHTML,
  generateExpensesListHTML,
  greetBasedOnTime,
};
