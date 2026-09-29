const { birthdayAnniversaryList } = require('../controllers/auth.controller');
const {
  getHrLeaveTypesByCompany1,
} = require('../controllers/hrLeaveTypes.controller');
const { getLeaveByUserId } = require('../controllers/userleave.controller');
const {
  chatbotResponse,
  chatbotEvents,
  handleBotError,
  emitBotEvent,
  generateEventListHTML,
  generateHolidayListHTML,
  generateLeaveBalanceHTML,
  generateLeavesListHTML,
  generateExpensesListHTML,
  getStartOfPreviousMonth,
  getEndOfNextMonth,
} = require('./helper');
const { fetchCurrentYearHolidays } = require('./queries');
const { userExpenseNew } = require('../controllers/userExpense.controller');

// This handles user input of main menu
const handleMainMenu = (data, socket) => {
  switch (data.message) {
    case '1':
      emitBotEvent(socket, chatbotResponse.leave, chatbotEvents.LEAVES);
      break;
    case '2':
      emitBotEvent(socket, chatbotResponse.expense, chatbotEvents.EXPENSES);
      break;
    case '3':
      emitBotEvent(socket, chatbotResponse.events, chatbotEvents.EVENTS);
      break;
    default:
      emitBotEvent(
        socket,
        chatbotResponse.invalidOption,
        chatbotEvents.FIRST_STEP
      );
      break;
  }
};

// This handles user input of events menu
const handleEventsMenu = async (data, socket) => {
  try {
    if (data.childEvent) {
      if (data.message === 'back') {
        return emitBotEvent(socket, chatbotResponse.events, data.responseTo);
      }
      switch (data.childEvent) {
        case chatbotEvents.BIRTHDAYS:
        case chatbotEvents.WORK_ANNIVERSARIES:
          const isBirthday = data.childEvent === chatbotEvents.BIRTHDAYS;
          const events = await birthdayAnniversaryList(
            isBirthday,
            socket.userDetails.parentCompanyMasterId,
            socket.userDetails.companyMasterId,
            +data.message
          );
          return emitBotEvent(
            socket,
            generateEventListHTML(
              events,
              isBirthday ? 'birthdays' : 'anniversaries'
            ),
            data.responseTo,
            data.childEvent
          );
        default:
          return emitBotEvent(
            socket,
            chatbotResponse.invalidOption,
            data.event,
            data.childEvent
          );
      }
    } else {
      switch (data.message) {
        case '1':
        case '2':
          const eventType =
            data.message === '1' ? 'birthdays' : 'work anniversaries';
          const childEvent =
            data.message === '1'
              ? chatbotEvents.BIRTHDAYS
              : chatbotEvents.WORK_ANNIVERSARIES;
          return emitBotEvent(
            socket,
            chatbotResponse.eventResponse(eventType),
            chatbotEvents.EVENTS,
            childEvent
          );
        case '3':
          const holidays = await fetchCurrentYearHolidays(
            socket.userDetails.userMasterId
          );
          const html = generateHolidayListHTML(holidays);
          return emitBotEvent(
            socket,
            html,
            chatbotEvents.EVENTS,
            chatbotEvents.HOLIDAYS
          );
        case 'back':
          return emitBotEvent(
            socket,
            chatbotResponse.BOT_INTRO(socket.userDetails.userName),
            chatbotEvents.FIRST_STEP
          );
        default:
          return emitBotEvent(
            socket,
            chatbotResponse.invalidOption,
            chatbotEvents.EVENTS
          );
      }
    }
  } catch (error) {
    handleBotError(socket, error);
  }
};

// This handles user input of leaves menu
const handleLeavesMenu = async (data, socket) => {
  try {
    if (data.childEvent && data.message === 'back') {
      return emitBotEvent(socket, chatbotResponse.leave, data.responseTo);
    }
    switch (data.message) {
      case '1':
        emitBotEvent(
          socket,
          chatbotResponse.addLeaveExpense(chatbotEvents.LEAVES),
          chatbotEvents.LEAVES,
          chatbotEvents.ADD_LEAVE
        );
        break;
      case '2':
        const leavesReq = {
          body: {
            enddate: getEndOfNextMonth(),
            id: socket.userDetails.userMasterId,
            startdate: getStartOfPreviousMonth(),
            limit: 30,
            page: 1,
            isSocketRequest: true,
          },
        };
        const leaves = await getLeaveByUserId(leavesReq, null, null);
        console.log(leaves);
        const leavesListHTML = generateLeavesListHTML(leaves);
        emitBotEvent(
          socket,
          leavesListHTML,
          chatbotEvents.LEAVES,
          chatbotEvents.LIST_LEAVE
        );
        break;
      case '3':
        const balanceReq = {
          body: {
            id: socket.userDetails.companyMasterId,
            userid: socket.userDetails.userMasterId,
            isSocketRequest: true,
          },
        };
        const leaveBalance = await getHrLeaveTypesByCompany1(
          balanceReq,
          null,
          null
        );
        const balanceHTML = generateLeaveBalanceHTML(leaveBalance);
        emitBotEvent(
          socket,
          balanceHTML,
          chatbotEvents.LEAVES,
          chatbotEvents.LEAVE_BALANCE
        );
        break;
      case 'back':
        emitBotEvent(
          socket,
          chatbotResponse.BOT_INTRO(socket.userDetails.userName),
          chatbotEvents.FIRST_STEP
        );
        break;
      default:
        emitBotEvent(
          socket,
          chatbotResponse.invalidOption,
          chatbotEvents.EVENTS
        );
        break;
    }
  } catch (error) {
    handleBotError(socket, error);
  }
};

// This handles user input of expense menu
const handleExpensesMenu = async (data, socket) => {
  try {
    if (data.childEvent && data.message === 'back') {
      return emitBotEvent(socket, chatbotResponse.expense, data.responseTo);
    }
    switch (data.message) {
      case '1':
        emitBotEvent(
          socket,
          chatbotResponse.addLeaveExpense(chatbotEvents.EXPENSES),
          chatbotEvents.EXPENSES,
          chatbotEvents.ADD_EXPENSE
        );
        break;
      case '2':
        const expensesReq = {
          body: {
            enddate: getEndOfNextMonth(),
            limit: 10,
            page: 1,
            startdate: getStartOfPreviousMonth(),
            userid: socket.userDetails.userMasterId,
            isSocketRequest: true,
          },
        };
        const expenses = await userExpenseNew(expensesReq, null, null);
        console.log(expenses);
        const expensesListHTML = generateExpensesListHTML(expenses);
        emitBotEvent(
          socket,
          expensesListHTML,
          chatbotEvents.EXPENSES,
          chatbotEvents.LIST_EXPENSE
        );
        break;
      case 'back':
        emitBotEvent(
          socket,
          chatbotResponse.BOT_INTRO(socket.userDetails.userName),
          chatbotEvents.FIRST_STEP
        );
        break;
      default:
        emitBotEvent(
          socket,
          chatbotResponse.invalidOption,
          chatbotEvents.EVENTS
        );
        break;
    }
  } catch (error) {
    handleBotError(socket, error);
  }
};

// This redirects to associated menu based on response to specific event
const handleSubMenuResponses = async (socket, data) => {
  try {
    if (Object.values(chatbotEvents).includes(data.responseTo)) {
      switch (data.responseTo) {
        case chatbotEvents.FIRST_STEP:
          handleMainMenu(data, socket);
          break;
        case chatbotEvents.LEAVES:
          await handleLeavesMenu(data, socket);
          break;
        case chatbotEvents.EXPENSES:
          await handleExpensesMenu(data, socket);
          break;
        case chatbotEvents.EVENTS:
          await handleEventsMenu(data, socket);
          break;
        default:
          break;
      }
    } else {
      emitBotEvent(socket, chatbotResponse.invalidOption);
    }
  } catch (error) {
    handleBotError(socket, error);
  }
};

const initialiseChatbotSocket = async (socket, data) => {
  if (data.message === 'exit') {
    socket.disconnect();
    return;
  }
  try {
    if (!socket.introSent) {
      socket.introSent = true;
      emitBotEvent(
        socket,
        chatbotResponse.BOT_INTRO(socket.userDetails.userName),
        chatbotEvents.FIRST_STEP
      );
    } else {
      await handleSubMenuResponses(socket, data);
    }
  } catch (error) {
    handleBotError(socket, error);
  }
};

module.exports = { initialiseChatbotSocket };
