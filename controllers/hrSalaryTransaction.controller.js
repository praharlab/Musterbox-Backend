/** @format */

const Sequelize = require('sequelize');
const HrSalaryTrans = require('../models/hrSalaryTransaction');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const userMaster = require('../models/userMaster');
const HRSalaryMaster = require('../models/hrSalaryMaster');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const { executeQuery } = require('./common.controller');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const Handlebars = require('handlebars');
const { promisify, log } = require('util');
const { data } = require('../config/logger');
const read = promisify(require('fs').readFile);
const path = require('path');
const pdf_options = { format: 'A4', quality: 300 };
const fs = require('fs');
var converter = require('number-to-words');
const HrSalarySlip = require('../models/hrSalarySlip');
const UserMaster = require('../models/userMaster');

const Designation = require('../models/designation');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const employeeSalaryPolicies = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const Payheadmaster = require('../models/payhead');
const HRSalaryMasterFields = require('../models/hrSalaryMaster');
const advancePayments = require('../models/advancePayment');
const LoanTransactions = require('../models/loanTransaction');
const Penalty = require('../models/penalty');
const ProfessionalTaxSlabMaster = require('../models/professionaltaxmaster');
const { add } = require('winston');
const HRSalarySlip = require('../models/hrSalarySlip');
const employeePenalties = require('../models/employeePenalty');
const LoanMaster = require('../models/loanMaster');
const WeekoffOptions = require('../models/weekOffOptions');
const attendanceTransaction = require('../models/attendanceTransaction');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendacePolicy = require('../models/attendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const HRSalaryFields = require('../models/hrSalaryFields');
const Employeeincentive = require('../models/employeeincentive');
const Shift = require('../models/shift');
const OverTimeCalculationMains = require('../models/overTimeCalculationMain');
const moment = require('moment');
const { ToWords } = require('to-words');
const puppeteer = require('puppeteer');
const { mainApiUrl } = require('../utils/labelUtils');

const toWords = new ToWords({
  localeCode: 'en-IN', // Indian Numbering System
  converterOptions: {
    currency: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  },
});

const {
  daysInMonth,
  employeeAttendancePolicy,
  employeeDepartment,
  employeeShift,
  employeeDesignation,
  employeeBranch,
  employeeSalaryPolicy,
  getemployeeJoiningDetails,
  getAllUserByCompanyDateWise,
  employeeLateEarlyPolicy,
  calculatePenaltyInSalary,
  month_dict,
  getUserByBranchandDateRange,
  getUserByCompanyandDateRange,
  getAttendanceData,
  getFinancialYearByMonth,
  incomeTaxCalculationByUserId,
  isValidDate,
  asiaKolkataDateTime,
  generateHTMLToPDF_base64Path,
  employeeeLeaveBalance,
  getUserSalaryMasterByMonth,
  getSalaryData,
  getDateRangeBySalaryPolicy,
  findCompanyNotificationPolicy,
  getStartAndEndDate,
  getPreviousMonth,
  getNextMonth,
} = require('../utils/commonUtilFunctions');
const Incentivetype = require('../models/incentivetype');
const EmployeePenalty = require('../models/employeePenalty');
const {
  generateDemoExcelForVariable,
  EmailSalarySlip,
  createZipFileForsalarySlip,
  generateExcel,
} = require('../utils/exportData');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

const EmployeeBonus = require('../models/employeeBonus');

const toMarathiWords = new ToWords({
  localeCode: 'mr-IN', // Indian Numbering System
  converterOptions: {
    currency: true,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  },
});
async function findBranchDepartDesig(start_date, userid) {
  const employeebranch = await employeeBranch(userid, start_date);

  let assignbranch;
  if (employeebranch) {
    assignbranch = employeebranch['branchMaster.branchName'];
    assignbranchAddress = `${employeebranch['branchMaster.branchAddress']},${employeebranch['branchMaster.cityMaster.cityName']},${employeebranch['branchMaster.cityMaster.stateMaster.stateName']},${employeebranch['branchMaster.cityMaster.stateMaster.countryMaster.countryName']}`;
  } else {
    assignbranch = '';
  }

  const employeedepart = await employeeDepartment(userid, start_date);

  let assigndepart;
  if (employeedepart) {
    assigndepart = employeedepart['department.departmentName'];
  } else {
    assigndepart = '';
  }

  const employeedesig = await employeeDesignation(userid, start_date);

  let assigndesig;
  if (employeedesig) {
    assigndesig = employeedesig['designation.designationName'];
  } else {
    assigndesig = '';
  }

  let data = {
    branch: assignbranch,
    branchAddress: assignbranchAddress ? assignbranchAddress : '',
    depart: assigndepart,
    desig: assigndesig,
  };

  return data;
}

async function getdates1(weekoffid, startdate, enddate, UserMasterID) {
  let alldata = [];
  alldata = await WeekoffOptions.findAll({
    where: {
      weekOffPolicyID: weekoffid,
    },
    include: [{ all: true, nested: true }],
  });
  function Value(option) {
    if (option.slice(0, 4) == 'full') {
      return 1;
    } else {
      return 0.5;
    }
  }

  function getDate(start_date, end_date, day0) {
    let start_year = start_date.slice(0, 4);
    let start_month = start_date.slice(5, 7);
    let start_day = start_date.slice(8, 10);

    let end_year = end_date.slice(0, 4);
    let end_month = end_date.slice(5, 7);
    let end_day = end_date.slice(8, 10);

    var end_date = new Date(start_year, start_month, 0).getDate();
    var day_date = new Array();
    var day_val;
    if (day0 == 'sunday') {
      day_val = 0;
    } else if (day0 == 'monday') {
      day_val = 1;
    } else if (day0 == 'tuesday') {
      day_val = 2;
    } else if (day0 == 'wednesday') {
      day_val = 3;
    } else if (day0 == 'thursday') {
      day_val = 4;
    } else if (day0 == 'friday') {
      day_val = 5;
    } else {
      day_val = 6;
    }

    for (var i = start_day - 1; i <= end_date; i++) {
      if (i != end_date) {
        var newDate = new Date(start_year, start_month - 1, i + 1);

        if (newDate.getDay() == day_val) {
          day_date.push(start_year + '-' + start_month + '-' + (i + 1));
        }
      } else {
        for (var j = 0; j < end_day; j++) {
          var newDate = new Date(end_year, end_month - 1, j + 1);

          if (newDate.getDay() == day_val) {
            //  day_date.push(j+1)
            day_date.push(end_year + '-' + end_month + '-' + (j + 1));
          }
        }
      }
    }
    return day_date;
  }
  var arr = [];
  let finalvalue = [];

  if (alldata.length > 0) {
    for (var i = 0; i < alldata.length; i++) {
      for (j = 0; j < alldata[i].dataValues.options.length; j++) {
        var value = Value(alldata[i].dataValues.options[j].option);
        var temp_date;
        var day = alldata[i].day;
        var year = String(startdate).slice(0, 4);
        var month = String(startdate).slice(5, 7);
        let yearMonth = year + month;
        var day_option = alldata[i].dataValues.options[j].name.slice(0, 3);

        if (day_option != 'all') {
          if (day_option == '1st') {
            temp_date = getDate(startdate, enddate, day)[0];
          } else if (day_option == '2nd') {
            temp_date = getDate(startdate, enddate, day)[1];
          } else if (day_option == '3rd') {
            temp_date = getDate(startdate, enddate, day)[2];
          } else if (day_option == '4th') {
            temp_date = getDate(startdate, enddate, day)[3];
          } else if (day_option == '5th') {
            temp_date = getDate(startdate, enddate, day)[4];
          } else {
            temp_date = null;
          }

          if (temp_date != null) {
            let Year = temp_date.slice(0, 4);
            let Month = temp_date.slice(5, 7);
            let monthyear = Year + Month;
            let temp = {
              companyMasterID:
                alldata[i].weekOffPolicy.dataValues.companyMasterID,
              userMasterID: UserMasterID,
              yearMonth: monthyear,
              date: new Date(new Date(temp_date).getTime() + 330 * 60000)
                .toISOString()
                .split('T')[0],
              dayName: alldata[i].day,
              value: value,
              tableName: 'weekoff',
            };
            finalvalue.push(value);
            arr.push(temp);
          }
        } else {
          for (k = 0; getDate(startdate, enddate, day)[k] != null; k++) {
            temp_date = getDate(startdate, enddate, day)[k];
            let Year = temp_date.slice(0, 4);
            let Month = temp_date.slice(5, 7);
            let monthyear = Year + Month;
            let temp = {
              companyMasterID:
                alldata[i].weekOffPolicy.dataValues.companyMasterID,
              userMasterID: UserMasterID,
              yearMonth: monthyear,
              date: new Date(new Date(temp_date).getTime() + 330 * 60000)
                .toISOString()
                .split('T')[0],
              dayName: alldata[i].day,
              value: value,
              tableName: 'weekoff',
            };
            finalvalue.push(value);
            arr.push(temp);
          }
        }
      }
    }
  }
  return arr;
}

async function price_in_words(price) {
  var sglDigit = [
      'Zero',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
    ],
    dblDigit = [
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ],
    tensPlace = [
      '',
      'Ten',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ],
    handle_tens = function (dgt, prevDgt) {
      return 0 == dgt
        ? ''
        : ' ' + (1 == dgt ? dblDigit[prevDgt] : tensPlace[dgt]);
    },
    handle_utlc = function (dgt, nxtDgt, denom) {
      return (
        (0 != dgt && 1 != nxtDgt ? ' ' + sglDigit[dgt] : '') +
        (0 != nxtDgt || dgt > 0 ? ' ' + denom : '')
      );
    };

  var str = '',
    digitIdx = 0,
    digit = 0,
    nxtDigit = 0,
    words = [];
  if (((price += ''), isNaN(parseInt(price)))) str = '';
  else if (parseInt(price) > 0 && price.length <= 10) {
    for (digitIdx = price.length - 1; digitIdx >= 0; digitIdx--)
      switch (
        ((digit = price[digitIdx] - 0),
        (nxtDigit = digitIdx > 0 ? price[digitIdx - 1] - 0 : 0),
        price.length - digitIdx - 1)
      ) {
        case 0:
          words.push(handle_utlc(digit, nxtDigit, ''));
          break;
        case 1:
          words.push(handle_tens(digit, price[digitIdx + 1]));
          break;
        case 2:
          words.push(
            0 != digit
              ? ' ' +
                  sglDigit[digit] +
                  ' Hundred' +
                  (0 != price[digitIdx + 1] && 0 != price[digitIdx + 2]
                    ? ' and'
                    : '')
              : ''
          );
          break;
        case 3:
          words.push(handle_utlc(digit, nxtDigit, 'Thousand'));
          break;
        case 4:
          words.push(handle_tens(digit, price[digitIdx + 1]));
          break;
        case 5:
          words.push(handle_utlc(digit, nxtDigit, 'Lakh'));
          break;
        case 6:
          words.push(handle_tens(digit, price[digitIdx + 1]));
          break;
        case 7:
          words.push(handle_utlc(digit, nxtDigit, 'Crore'));
          break;
        case 8:
          words.push(handle_tens(digit, price[digitIdx + 1]));
          break;
        case 9:
          words.push(
            0 != digit
              ? ' ' +
                  sglDigit[digit] +
                  ' Hundred' +
                  (0 != price[digitIdx + 1] || 0 != price[digitIdx + 2]
                    ? ' and'
                    : ' Crore')
              : ''
          );
      }
    str = words.reverse().join('');
  } else str = '';
  return str;
}

function penaltyDeductionCalculation(
  LCEGPenaltyData = [],
  attendanceTransData = [],
  salary_CalculationDays,
  gross,
  salarystructuretype,
  salary_calculation_wise
) {
  // Attendance penalty

  let penalty_amount = +(
    LCEGPenaltyData.find((e) => e.penaltyType == LCEGPenaltyTypeEnum.AMOUNT)
      ?.penaltyValue || 0
  );

  let minFlag = false,
    dayFlag = false,
    percentFlag = false;
  // set flag to count penalty
  LCEGPenaltyData.forEach((e) => {
    if (e.penaltyType == LCEGPenaltyTypeEnum.MINUTE) minFlag = true;
    if (e.penaltyType == LCEGPenaltyTypeEnum.DAY) dayFlag = true;
    if (e.penaltyType == LCEGPenaltyTypeEnum.PERCENT) percentFlag = true;
  });

  // - Salary structure is Monthly ('M') and not calculated hourwise, OR
  // - Salary structure is Daily ('D')
  if (
    (salarystructuretype == 'M' && salary_calculation_wise != 'hourwise') ||
    salarystructuretype == 'D'
  ) {
    const perDayGross =
      salarystructuretype == 'D' ? +gross : +gross / +salary_CalculationDays;

    const dayPenaltyAmount =
      +(
        LCEGPenaltyData.find((e) => e.penaltyType == LCEGPenaltyTypeEnum.DAY)
          ?.penaltyValue || 0
      ) * perDayGross;
    const percentPenaltyAmount =
      (+(
        LCEGPenaltyData.find(
          (e) => e.penaltyType == LCEGPenaltyTypeEnum.PERCENT
        )?.penaltyValue || 0
      ) *
        perDayGross) /
      100;

    penalty_amount += +dayPenaltyAmount + +percentPenaltyAmount;

    // if minute wise penalty

    if (minFlag) {
      attendanceTransData.forEach((e) => {
        if (
          e.PanaltyDeduction == LCEGPenaltyTypeEnum.MINUTE ||
          e.goEarlyPanaltyDeduction == LCEGPenaltyTypeEnum.MINUTE
        ) {
          penalty_amount +=
            e.PanaltyDeduction == LCEGPenaltyTypeEnum.MINUTE
              ? (+perDayGross / (+e.Shifthrs * 60)) * +e.Panalty
              : 0;
          penalty_amount +=
            e.goEarlyPanaltyDeduction == LCEGPenaltyTypeEnum.MINUTE
              ? (+perDayGross / (+e.Shifthrs * 60)) * +e.goEarlyPanalty
              : 0;
        }
      });
    }
  }

  // if hourly calculation

  if (
    ['M', 'H'].includes(salarystructuretype) &&
    salary_calculation_wise == 'hourwise'
  ) {
    const perMinuteGross =
      salarystructuretype == 'H'
        ? +gross / 60
        : +gross / +salary_CalculationDays;

    const minPenaltyAmount =
      +(
        LCEGPenaltyData.find((e) => e.penaltyType == LCEGPenaltyTypeEnum.MINUTE)
          ?.penaltyValue || 0
      ) * perMinuteGross;

    penalty_amount += +minPenaltyAmount;

    // if day wise and percent penalty

    if (percentFlag || dayFlag) {
      attendanceTransData.forEach((e) => {
        if (
          [LCEGPenaltyTypeEnum.DAY, LCEGPenaltyTypeEnum.PERCENT].includes(
            e.PanaltyDeduction
          ) ||
          [LCEGPenaltyTypeEnum.DAY, LCEGPenaltyTypeEnum.PERCENT].includes(
            e.goEarlyPanaltyDeduction
          )
        ) {
          const perDayGross =
            salarystructuretype == 'H'
              ? +gross * +e.Shifthrs
              : (+gross / +salary_CalculationDays) * 60 * +e.Shifthrs;

          penalty_amount +=
            e.PanaltyDeduction == LCEGPenaltyTypeEnum.DAY && dayFlag
              ? +perDayGross * +e.Panalty
              : e.PanaltyDeduction == LCEGPenaltyTypeEnum.PERCENT && percentFlag
                ? (+perDayGross * +e.Panalty) / 100
                : 0;
          penalty_amount +=
            e.goEarlyPanaltyDeduction == LCEGPenaltyTypeEnum.DAY && dayFlag
              ? +perDayGross * +e.goEarlyPanalty
              : e.goEarlyPanaltyDeduction == LCEGPenaltyTypeEnum.PERCENT &&
                  percentFlag
                ? (+perDayGross * +e.goEarlyPanalty) / 100
                : 0;
        }
      });
    }
  }

  return penalty_amount;
}

function calculateLeaveEncashment(
  allEmployeeLeavePolicy = [],
  AllHrleaveTypes = [],
  employeeLeaveEncashment = [],
  AllsalarystructureData = [],
  salary_calculation_wise = '',
  salary_CalculationDays
) {
  let amount = 0;
  const encashIds = [];
  // loop through all leave encash data
  for (const encash of employeeLeaveEncashment) {
    const leaveType = AllHrleaveTypes.find(
      (e) => e.LeaveTranId == encash.LeaveTranId
    );
    if (!leaveType) continue;

    const leavePolicy = allEmployeeLeavePolicy.find(
      (e) => e.leaveId == leaveType.LeaveID
    );

    // if employee leave policy is not assign
    if (!leavePolicy) {
      if (!AllsalarystructureData.length) continue;

      const gross =
        AllsalarystructureData.find((e) => e.payheadMasterId == 50)
          ?.EmployeeSalaryAmount || 0;

      if (AllsalarystructureData[0].baseOnCalculation == 'H')
        amount += +gross * 8 * +encash.days;
      if (AllsalarystructureData[0].baseOnCalculation == 'D')
        amount += +gross * +encash.days;

      if (AllsalarystructureData[0].baseOnCalculation == 'M') {
        if (salary_calculation_wise == 'hourwise') {
          const minuteSalary = +gross / +salary_CalculationDays;
          amount += +minuteSalary * 480 * +encash.days;
        } else {
          amount += (+gross / +salary_CalculationDays) * +encash.days;
        }
      }

      encashIds.push(encash.id);
      continue;
    }

    // if set fix amount
    if (leavePolicy.fixedAmount_ENC)
      amount += +leavePolicy.fixedAmount_ENC * encash.days;

    if (leavePolicy.payheadIds && leavePolicy.payheadIds.length) {
      const payheadData = AllsalarystructureData.filter((e) =>
        [...leavePolicy.payheadIds].includes(e.payheadMasterId)
      );
      if (!payheadData.length) continue;

      const gross = payheadData.reduce(
        (acc, obj) => acc + +obj.EmployeeSalaryAmount,
        0
      );

      if (payheadData[0].baseOnCalculation == 'H')
        amount += +gross * 8 * +encash.days * +leavePolicy.ratio;
      if (payheadData[0].baseOnCalculation == 'D')
        amount += +gross * +encash.days * +leavePolicy.ratio;

      if (payheadData[0].baseOnCalculation == 'M') {
        if (salary_calculation_wise == 'hourwise') {
          const minuteSalary = +gross / +salary_CalculationDays;
          amount += +minuteSalary * 480 * +encash.days * +leavePolicy.ratio;
        } else {
          amount +=
            (+gross / +salary_CalculationDays) *
            +encash.days *
            +leavePolicy.ratio;
        }
      }
    }

    encashIds.push(encash.id);
  }

  return { amount, encashIds };
}

async function getPayBonusAmount(
  bonusPolicy,
  YYYYMM,
  currentBonus = 0,
  userMasterID
) {
  let amount = 0,
    ids = [],
    addcurrentId = false;
  if (!bonusPolicy) return { amount, ids, addcurrentId };
  if (!bonusPolicy.payInSalary) return { amount, ids, addcurrentId };

  const YYYY = String(YYYYMM).slice(0, 4);
  const MM = String(YYYYMM).slice(4, 6);

  const bonusCycle = bonusPolicy.bonusCycle;
  // if bonus Pay type is Previous
  if (bonusPolicy.bonusCreditType == bonusCreditTypeEnum.PREVIOUS && +MM == 9) {
    let startMonth = YYYYMM,
      endMonth = YYYYMM;
    // if cycle january to december
    if (bonusCycle == yearCycleEnum.JAN_DEC) {
      startMonth = +YYYY - 1 + '01';
      endMonth = +YYYY - 1 + '12';
    }

    // if cycle April to March
    if (bonusCycle == yearCycleEnum.APRIL_MARCH) {
      startMonth = +YYYY - 1 + '04';
      endMonth = YYYY + '03';
    }

    const employeeBonus = await EmployeeBonus.findAll({
      where: {
        bonusYYYYMM: {
          [Sequelize.Op.between]: [startMonth, endMonth],
        },
        payReferenceId: {
          [Sequelize.Op.is]: null,
        },
        employeePaymentId: {
          [Sequelize.Op.is]: null,
        },
        payReferenceId: {
          [Sequelize.Op.is]: null,
        },
        status: 1,
        userMasterID,
      },
    });

    amount = employeeBonus.reduce((acc, obj) => acc + +obj.amount, 0);

    return { amount, ids: employeeBonus.map((e) => e.id), addcurrentId };
  }

  // if bonus Pay type is current
  if (bonusPolicy.bonusCreditType == bonusCreditTypeEnum.CURRENT) {
    let startMonth = YYYYMM,
      endMonth = YYYYMM,
      payBonus = false;

    if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.MONTHLY)
      payBonus = true;

    if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.QUARTERLY) {
      if ([3, 6, 9, 12].includes(+MM)) {
        payBonus = true;

        if (+MM == 3) {
          startMonth = YYYY + '01';
        }

        if (+MM == 6) {
          startMonth = YYYY + '04';
        }

        if (+MM == 9) {
          startMonth = YYYY + '07';
        }

        if (+MM == 12) {
          startMonth = YYYY + '10';
        }
      }
    }

    if (bonusCycle == yearCycleEnum.JAN_DEC) {
      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.HALFYEARLY) {
        if ([6, 12].includes(+MM)) {
          payBonus = true;

          if (+MM == 6) {
            startMonth = YYYY + '01';
          }

          if (+MM == 12) {
            startMonth = YYYY + '07';
          }
        }
      }

      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.YEARLY) {
        if ([12].includes(+MM)) {
          payBonus = true;

          if (+MM == 12) {
            startMonth = YYYY + '01';
          }
        }
      }
    }

    if (bonusCycle == yearCycleEnum.APRIL_MARCH) {
      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.HALFYEARLY) {
        if ([9, 3].includes(+MM)) {
          payBonus = true;

          if (+MM == 9) {
            startMonth = YYYY + '04';
          }

          if (+MM == 3) {
            startMonth = +YYYY - 1 + '10';
          }
        }
      }

      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.YEARLY) {
        if ([3].includes(+MM)) {
          payBonus = true;

          if (+MM == 3) {
            startMonth = +YYYY - 1 + '04';
          }
        }
      }
    }

    if (payBonus) {
      const employeeBonus = await EmployeeBonus.findAll({
        where: {
          bonusYYYYMM: {
            [Sequelize.Op.between]: [startMonth, endMonth],
          },
          payReferenceId: {
            [Sequelize.Op.is]: null,
          },
          employeePaymentId: {
            [Sequelize.Op.is]: null,
          },
          payReferenceId: {
            [Sequelize.Op.is]: null,
          },
          status: 1,
          userMasterID,
        },
      });

      amount = employeeBonus.reduce((acc, obj) => acc + +obj.amount, 0);

      return {
        amount: amount + currentBonus,
        ids: employeeBonus.map((e) => e.id),
        addcurrentId: true,
      };
    }
  }

  return { amount, ids, addcurrentId };
}

const chunkArray = (array, chunkSize) => {
  const results = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }
  return results;
};

exports.GenrateSalary = async (req, res, next) => {
  try {
    const {
      userMasterID,
      yearmonth,
      // createBy,
      createByIp,
      from = 'salary',
    } = await req.body;
    const user = userMasterID;
    const createBy = req.userDetails.userMasterId;

    const now = new Date();
    const currentYYYYMM = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    if (+yearmonth > +currentYYYYMM) {
      return res.status(200).json({
        status: 401,
        message: `You can't calculate salary for a future month (${yearmonth})`,
      });
    }

    const getTemplate = (type) => {
      const file = path.join(__dirname, `../html/${type}.hbs`);
      return file;
    };

    Handlebars.registerHelper({
      eq: (v1, v2) => v1 === v2,
      ne: (v1, v2) => v1 !== v2,
      lt: (v1, v2) => v1 < v2,
      gt: (v1, v2) => v1 > v2,
      lte: (v1, v2) => v1 <= v2,
      gte: (v1, v2) => v1 >= v2,
      and() {
        return Array.prototype.every.call(arguments, Boolean);
      },
      or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
      },
    });

    const readFile = (name) => {
      return new Promise((resolve, reject) => {
        fs.readFile(name, 'utf-8', (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const year = yearmonth.slice(0, 4);
    const Month = yearmonth.slice(4, 6);
    const temp_monday = daysInMonth(Month, year);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const enddate = year + '-' + Month + '-' + temp_monday;

    const condition = {
      status: 1,
      applicableDate: { [Sequelize.Op.lte]: new Date(enddate) },
      [Sequelize.Op.or]: [
        { endDate: { [Sequelize.Op.gte]: new Date(enddate) } },
        { endDate: { [Sequelize.Op.eq]: null } },
      ],
    };

    const chunks = chunkArray(user, 300);

    for (const chunk of chunks) {
      const [usermaster, salaryMasterData, AllUserAttendanceData] =
        await Promise.all([
          UserMaster.findAll({
            // raw: true,
            where: {
              userMasterID: chunk,
              status: 1,
            },
            include: [
              {
                model: companyMaster,
                attributes: [
                  'companyName',
                  'tdsdeduction',
                  'companyLogo',
                  'companyAddress',
                  'cinNumber',
                  'companyWebsite',
                ],
              },
              {
                separate: true,
                model: EmployeeJoiningDetails,
                include: [
                  {
                    required: false,
                    model: Contractor,
                    include: [
                      {
                        model: CityMaster,
                        attributes: ['cityName'],
                        include: [
                          {
                            model: StateMaster,
                            attributes: ['stateName'],
                            include: [
                              {
                                model: CountryMaster,
                                attributes: ['countryName'],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    required: false,
                    model: BankMaster,
                  },
                ],
              },
              {
                model: EmployeeDesignation,
                where: condition,
                required: false,
                attributes: ['designationID'],
                include: [
                  {
                    model: Designation,
                    as: 'designation',
                    attributes: ['designationName'],
                  },
                ],
              },
              {
                model: EmployeeDepartment,
                where: condition,
                required: false,
                attributes: ['departmentID'],
                include: [
                  {
                    model: Department,
                    as: 'department',
                    attributes: ['departmentName'],
                  },
                ],
              },
              {
                model: EmployeeBranch,
                where: condition,
                required: false,
                attributes: ['branchID'],
                include: [
                  {
                    model: BranchMaster,
                    as: 'branchMaster',
                    attributes: ['branchName', 'branchAddress'],
                  },
                ],
              },
              {
                model: EmployeeSalaryPolicy,
                where: {
                  status: 1,
                  startDate: { [Sequelize.Op.lte]: new Date(enddate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(enddate) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
                separate: true,
                attributes: ['salaryPolicyID'],
                include: [
                  {
                    model: SalaryPolicy,
                    as: 'salaryPolicy',
                  },
                ],
              },
              {
                required: false,
                model: deposit,
                where: {
                  status: 1,
                  depositReceiveAs: 'salary',
                  salaryMonth: yearmonth,
                },
                include: [
                  {
                    model: depositcategory,
                    attributes: ['depositcategoryname'],
                  },
                ],
              },
              // leave Policy
              {
                model: empLeavePolicy,
                where: condition,
                required: false,
                attributes: ['userMasterID', 'employeeLeavePolicyID'],
              },
              {
                required: false,
                model: LeaveEncashment,
                where: {
                  YYYYMM: yearmonth,
                  status: 1,
                },
              },
              // Bonus Policy
              {
                required: false,
                model: EmployeeBonusPolicy,
                where: {
                  status: 1,
                  applicableYYYYMM: { [Sequelize.Op.lte]: yearmonth },
                  [Sequelize.Op.or]: [
                    { endYYYYMM: { [Sequelize.Op.gte]: yearmonth } },
                    { endYYYYMM: { [Sequelize.Op.eq]: null } },
                  ],
                },
                include: [{ model: BonusPolicy }],
              },
              // LCEG Penalty
              {
                required: false,
                model: LCEGPenalty,
                where: {
                  YYYYMM: yearmonth,
                },
              },
              // salarySlip
              {
                required: false,
                model: HrSalarySlip,
                salaryYYYYMM: yearmonth,
              },
            ],
            order: [['displayName', 'ASC']],
          }),
          HRSalaryMaster.findAll({
            raw: true,
            where: {
              userMasterID: {
                [Sequelize.Op.in]: chunk,
              },
              [Sequelize.Op.and]: Sequelize.literal(`
            ("hrSalaryMaster"."userMasterID", "hrSalaryMaster"."salaryFromYYYYMM") IN (
              SELECT "userMasterID", MAX("salaryFromYYYYMM") AS "maxMonth"
              FROM "hrSalaryMasters"
              WHERE "salaryFromYYYYMM" <= ${yearmonth}
              AND "userMasterID" IN (${chunk.join(',')})
              GROUP BY "userMasterID"
            )
          `),
            },
            include: [
              {
                model: GradeSalaryStructure,
                include: [
                  { model: GradeStructure, attributes: [] },
                  {
                    model: HRSalaryFields,
                    include: [
                      {
                        model: Payheadmaster,
                        attributes: [],
                      },
                    ],
                    attributes: [],
                  },
                ],
                attributes: [],
                // order: [
                //   // Order by salaryfieldindex in GradeSalaryStructure
                //   ['salaryfieldindex', 'ASC'],

                //   // Order by payheadName in Payheadmaster
                //   [
                //     { model: HRSalaryFields, model: Payheadmaster },
                //     'payheadName',
                //     'ASC',
                //   ],
                // ],
              },
            ],
            attributes: [
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.Payheadmaster.payheadName'
                ),
                'payheadName',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.payheadDisplayName'
                ),
                'payheadDisplayName',
              ],
              [
                Sequelize.col('gradeSalaryStructure.hrSalaryField.status'),
                'status',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.payheadMasterId'
                ),
                'payheadMasterId',
              ],
              'AmountIn',
              'stateid',
              'salaryMasterID',
              'EmployeeSalaryAmount',
              'ActualEmployeeSalaryAmount',
              'salaryFromYYYYMM',
              'userMasterID',
              'gradeSalaryStructureID',
              [
                Sequelize.col(
                  'gradeSalaryStructure.gradeStructure.baseOnCalculation'
                ),
                'baseOnCalculation',
              ],
              [Sequelize.col('gradeSalaryStructure.formula'), 'formula'],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldSrNo'
                ),
                'salaryFieldSrNo',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldSide'
                ),
                'salaryFieldSide',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldShow'
                ),
                'salaryFieldShow',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldAttanChk'
                ),
                'salaryFieldAttanChk',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldRound'
                ),
                'salaryFieldRound',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldRoundNo'
                ),
                'salaryFieldRoundNo',
              ],
              [
                Sequelize.col('gradeSalaryStructure.salaryfieldindex'),
                'salaryfieldindex',
              ],
              [
                Sequelize.col('gradeSalaryStructure.salaryfieldmaxrange'),
                'salaryfieldmaxrange',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.salaryFieldWhenMonth'
                ),
                'salaryFieldWhenMonth',
              ],
              [
                Sequelize.col(
                  'gradeSalaryStructure.hrSalaryField.roundOffType'
                ),
                'roundOffType',
              ],
              [
                Sequelize.col('gradeSalaryStructure.hrSalaryField.considerIn'),
                'considerIn',
              ],
            ],
            order: [
              // Order by salaryfieldindex in GradeSalaryStructure
              [
                { model: GradeSalaryStructure, as: 'gradeSalaryStructure' },
                'salaryfieldindex',
                'ASC',
              ],

              // Order by payheadName in Payheadmaster
              [
                { model: GradeSalaryStructure, as: 'gradeSalaryStructure' },
                { model: HRSalaryFields, as: 'hrSalaryField' },
                { model: Payheadmaster, as: 'Payheadmaster' },
                'payheadName',
                'ASC',
              ],
            ],
          }),
          HrLeaveMonthlyTrans.findAll({
            raw: true,
            where: {
              userMasterID: chunk,
              AttnYearMon: yearmonth,
              verified: 1,
            },
            include: [
              {
                model: HrLeaveTypes,
                where: { LeaveID: { [Sequelize.Op.notIn]: [29, 32] } },
                attributes: ['LeaveID'],
              },
            ],
          }),
        ]);

      const All_EmployeeLeavePolicyIds = [
        ...new Set(
          usermaster.flatMap(
            (e) => e.empLeavePolicies?.[0]?.employeeLeavePolicyID
          )
        ),
      ];

      let allEmployeeLeavePolicy = [],
        AllHrleaveTypes = [];

      if (All_EmployeeLeavePolicyIds.length && usermaster.length) {
        [allEmployeeLeavePolicy, AllHrleaveTypes] = await Promise.all([
          employeeLeavePolicy.findAll({
            where: {
              id: {
                [Sequelize.Op.in]: All_EmployeeLeavePolicyIds,
              },
            },
            attributes: [
              'id',
              'fixedAmount_ENC',
              'leaveId',
              'payheadIds',
              'ratio',
            ],
          }),
          HrLeaveTypes.findAll({
            where: {
              companyMasterID: usermaster[0].companyMasterId,
              status: 1,
            },
          }),
        ]);
      }

      //For Jeevdani find ot_calculation

      let All_OT_Cal = [];
      if (
        usermaster.length > 0 &&
        [560, 630].includes(+usermaster[0].companyMasterId)
      ) {
        All_OT_Cal = await overTimeCalculationMain.findAll({
          raw: true,
          where: {
            userMasterID: chunk,
          },
        });
      }

      for (let i = 0; i < usermaster.length; i++) {
        const employeeSalary = await HRSalaryTrasaction.findOne({
          where: {
            userMasterID: usermaster[i].userMasterID,
            salaryYYYYMM: yearmonth,
          },
        });

        if (employeeSalary) continue;

        // Attendance verified or not

        const AllcalculatedAttendanceData = AllUserAttendanceData.filter(
          (e) => e.userMasterID == usermaster[i].userMasterID
        );

        const employeeJoining =
          usermaster[i].employeeJoiningDetails &&
          usermaster[i].employeeJoiningDetails.length > 0
            ? usermaster[i].employeeJoiningDetails[0]
            : null;

        // Exclude FNF employee ids data

        if (from == 'salary') {
          const leavingDate = employeeJoining?.leavingDate || '';
          if (leavingDate) {
            const startDate =
                AllcalculatedAttendanceData[0]?.monthstartdate || '',
              endDate = AllcalculatedAttendanceData[0]?.monthenddate || '';
            if (
              startDate &&
              endDate &&
              new Date(leavingDate).getTime() >=
                new Date(startDate).getTime() &&
              new Date(leavingDate).getTime() <= new Date(endDate)
            )
              continue;
          }
        }

        const calculatedAttendanceData = AllUserAttendanceData.filter(
          (e) =>
            e.userMasterID == usermaster[i].userMasterID &&
            ![30, 31].includes(e['hrLeaveType.LeaveID'])
        );
        if (calculatedAttendanceData.length === 0) continue;
        // salary structure found or not
        const AllsalarystructureData = salaryMasterData.filter(
          (e) => e.userMasterID == usermaster[i].userMasterID
        );

        const CTC_GROSS_NET = AllsalarystructureData.filter((e) =>
          [50, 92, 1].includes(e.payheadMasterId)
        );

        const EPF_Data = AllsalarystructureData.find(
          (e) => e.payheadMasterId == 5
        );

        const salarystructure = AllsalarystructureData.filter(
          (e) => ![50, 92, 1, 99, 5].includes(e.payheadMasterId)
        );

        // for LWP Deduction
        const lwp_deduction = AllsalarystructureData.find(
          (e) => e.payheadMasterId == 99
        );

        const LWP_flag = lwp_deduction?.status == 1 ? true : false;

        if (salarystructure.length === 0) continue;

        const employeeBranch =
          usermaster[i].employeeBranches &&
          usermaster[i].employeeBranches.length > 0
            ? usermaster[i].employeeBranches[0].branchMaster
              ? usermaster[i].employeeBranches[0].branchMaster.branchName
              : ''
            : '';
        const employeeBranchAddress =
          usermaster[i].employeeBranches &&
          usermaster[i].employeeBranches.length > 0
            ? usermaster[i].employeeBranches[0].branchMaster
              ? usermaster[i].employeeBranches[0].branchMaster.branchAddress
              : ''
            : '';

        const employeeDepartment =
          usermaster[i].employeeDepartments &&
          usermaster[i].employeeDepartments.length > 0
            ? usermaster[i].employeeDepartments[0].department
              ? usermaster[i].employeeDepartments[0].department.departmentName
              : ''
            : '';
        const employeeDesignation =
          usermaster[i].employeeDesignations &&
          usermaster[i].employeeDesignations.length > 0
            ? usermaster[i].employeeDesignations[0].designation
              ? usermaster[i].employeeDesignations[0].designation
                  .designationName
              : ''
            : '';
        const employeeSalaryPolicy =
          usermaster[i].employeeSalaryPolicies &&
          usermaster[i].employeeSalaryPolicies.length > 0
            ? usermaster[i].employeeSalaryPolicies[0].salaryPolicy
            : null;

        // Bonus Policy
        const bonusPolicy =
          usermaster[i].employeeBonusPolicies?.[0]?.bonusPolicy || null;

        // Encashment Data

        const employeeLeaveEncashment = usermaster[i].leaveEncashments || [];

        // LCEG Penalty Data
        const LCEGPenaltyData = usermaster[i].lcegPenalties || [];

        // set ESIC deduction yes or no

        const esicDeduction =
          employeeJoining &&
          employeeJoining.esicEndMonth &&
          employeeJoining.esicEndMonth !== 'undefined'
            ? employeeJoining.esicEndMonth < +yearmonth
              ? false
              : true
            : true;

        let start_date = `${year}-${String(Month).padStart(2, '0')}-01`;
        let end_date = enddate,
          monday = temp_monday;

        // if salary policy is available
        if (employeeSalaryPolicy) {
          let date = employeeSalaryPolicy.salaryCycleDate;

          const paddedDate = String(date).padStart(2, '0');
          start_date = `${year}-${String(Month).padStart(2, '0')}-${paddedDate}`;

          // To Check salary consider Month

          if (employeeSalaryPolicy.salaryCycleConsider == 'E') {
            const tempDate = new Date(start_date);
            tempDate.setMonth(tempDate.getMonth() - 1);

            start_date =
              tempDate.getFullYear() +
              '-' +
              String(tempDate.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(tempDate.getDate()).padStart(2, '0');

            // set Month days
            monday = daysInMonth(
              start_date.slice(5, 7),
              start_date.slice(0, 4)
            );
          }

          // Calculate the end date
          const startDateObj = new Date(start_date);
          startDateObj.setDate(startDateObj.getDate() + (monday - 1));

          end_date = `${startDateObj.getFullYear()}-${String(
            startDateObj.getMonth() + 1
          ).padStart(
            2,
            '0'
          )}-${String(startDateObj.getDate()).padStart(2, '0')}`;
        }

        // Attendancepolicy
        const userAttendacepolicy = await employeeAttendancePolicy(
          usermaster[i].userMasterID,
          end_date
        );

        let userSalaryArray = [];
        let employee_netPay = 0;
        let employee_gross = 0;
        let gross =
          CTC_GROSS_NET.find((e) => e.payheadMasterId == 50)
            ?.EmployeeSalaryAmount || 0;
        let employee_extraAddInNetPay = 0;

        let salary_CalculationDays;
        let usertotalpresentday;
        let salary_calculation_wise;
        let dailyworkingminutes;
        let showusersalary = [];
        let overtime_min = 0;

        let totaldays = calculatedAttendanceData.reduce(
          (acc, obj) => acc + +obj.AttnVal,
          0
        );
        let salaryCalculationAct = employeeJoining.salaryCalculationAct;

        const weekOffHolidayPriority =
          userAttendacepolicy?.WHPHPriority || null;

        const typeCondition =
          weekOffHolidayPriority === 'PH' ? "'holiday'" : "'weekoff'";

        const weekoffHoliday = await weekoffHolidayTran.findAll({
          where: {
            userMasterID: usermaster[i].userMasterID,
            date: {
              [Sequelize.Op.between]: [start_date, end_date],
            },
            [Sequelize.Op.and]: Sequelize.literal(`(date, "tableName") IN (
              SELECT date, 
                     CASE 
                       WHEN SUM(CASE WHEN "tableName" = 'weekoff' THEN 1 ELSE 0 END) > 0 
                            AND SUM(CASE WHEN "tableName" = 'holiday' THEN 1 ELSE 0 END) > 0 
                       THEN MAX(CASE WHEN "tableName" = ${typeCondition} THEN "tableName" END)
                       ELSE MAX("tableName") 
                     END AS selected_tableName
              FROM "weekoffHolidayTrans"
              WHERE "userMasterID" = ${usermaster[i].userMasterID}
                AND date BETWEEN '${start_date}' AND '${end_date}'
                AND ("optionalHoliday" IS FALSE OR "optionalHoliday" IS NULL)
              GROUP BY date
            )`),
          },
          order: [
            ['date', 'ASC'],
            ['tableName', 'DESC'],
          ],
        });

        // To Get UnPaid Days Of User
        const unpaidDays = calculatedAttendanceData
          .filter((e) => [5, 18, 22, 28].includes(e['hrLeaveType.LeaveID']))
          .reduce((acc, obj) => acc + +obj.AttnVal, 0);

        if (employeeSalaryPolicy) {
          let salaryCalculationDays =
              employeeSalaryPolicy.salaryCalculationDays,
            salarycalbasedon = employeeSalaryPolicy.salarycalculationBasedon;
          if (salaryCalculationDays && salarycalbasedon == 'daywise') {
            salary_CalculationDays = salaryCalculationDays;

            if (salaryCalculationAct == 'F' || salaryCalculationAct == 'W') {
              const notpaiddata =
                salaryCalculationAct == 'F'
                  ? calculatedAttendanceData.filter((e) =>
                      [5, 18, 7, 22, 28].includes(e['hrLeaveType.LeaveID'])
                    )
                  : calculatedAttendanceData.filter((e) =>
                      [5, 18, 7, 9, 22, 28].includes(e['hrLeaveType.LeaveID'])
                    );

              const userabsentday = notpaiddata.reduce(
                (acc, obj) => acc + +obj.AttnVal,
                0
              );

              usertotalpresentday =
                +totaldays - +userabsentday > 0
                  ? +totaldays - +userabsentday
                  : 0;
            } else {
              const excludedLeaveIDs = [5, 18, 22, 28];

              usertotalpresentday = calculatedAttendanceData.reduce(
                (acc, obj) => {
                  if (!excludedLeaveIDs.includes(obj['hrLeaveType.LeaveID'])) {
                    return acc + Number(obj.AttnVal);
                  }
                  return acc;
                },
                0
              );
            }
          } else {
            if (salarycalbasedon == 'hourwise') {
              salary_calculation_wise = 'hourwise';

              const attendance = await attendanceTransaction.findOne({
                raw: true,
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  AttendanceDate: {
                    [Sequelize.Op.between]: [start_date, end_date],
                  },
                },
                order: [['AttendanceDate', 'DESC']],
              });

              let monthly_Workingminutes;
              let daily_workingminutes;

              if (!employeeSalaryPolicy.monthlyFixhours) {
                if (!employeeSalaryPolicy.dailyFixhours) {
                  if (attendance) {
                    monthly_Workingminutes =
                      Number(attendance.Shifthrs) * Number(monday) * 60;
                    daily_workingminutes = Number(attendance.Shifthrs) * 60;
                  } else {
                    monthly_Workingminutes = 8 * Number(monday) * 60;
                    daily_workingminutes = 8 * 60;
                  }
                } else {
                  monthly_Workingminutes =
                    Number(employeeSalaryPolicy.dailyFixhours) *
                    Number(monday) *
                    60;
                  daily_workingminutes =
                    Number(employeeSalaryPolicy.dailyFixhours) * 60;
                }
              } else {
                monthly_Workingminutes =
                  Number(employeeSalaryPolicy.monthlyFixhours) * 60;
                daily_workingminutes =
                  Number(monthly_Workingminutes) / Number(monday);
              }

              salary_CalculationDays = Number(monthly_Workingminutes);
              dailyworkingminutes = Number(daily_workingminutes);

              usertotalpresentday = calculatedAttendanceData.reduce(
                (acc, obj) => {
                  if (obj['hrLeaveType.LeaveID'] == 20) {
                    return acc + Number(obj.AttnVal);
                  }
                  return acc;
                },
                0
              );
            } else {
              if (salaryCalculationAct == 'F' || salaryCalculationAct == 'W') {
                const notpaiddata =
                  salaryCalculationAct == 'F'
                    ? calculatedAttendanceData.filter((e) =>
                        [5, 18, 7, 22, 28].includes(e['hrLeaveType.LeaveID'])
                      )
                    : calculatedAttendanceData.filter((e) =>
                        [5, 18, 7, 9, 22, 28].includes(e['hrLeaveType.LeaveID'])
                      );

                const sumOfWeekoff =
                  salaryCalculationAct == 'F'
                    ? weekoffHoliday
                        .filter((e) => e.tableName == 'weekoff')
                        .reduce((acc, obj) => acc + +obj.value, 0)
                    : weekoffHoliday.reduce((acc, obj) => acc + +obj.value, 0);

                salary_CalculationDays = +monday - +sumOfWeekoff;

                const userabsentday = notpaiddata.reduce(
                  (acc, obj) => acc + +obj.AttnVal,
                  0
                );

                usertotalpresentday =
                  +totaldays - +userabsentday > 0
                    ? +totaldays - +userabsentday
                    : 0;
              } else {
                salary_CalculationDays = Number(monday);

                const excludedLeaveIDs = [5, 18, 22, 28];

                usertotalpresentday = calculatedAttendanceData.reduce(
                  (acc, obj) => {
                    if (
                      !excludedLeaveIDs.includes(obj['hrLeaveType.LeaveID'])
                    ) {
                      return acc + Number(obj.AttnVal);
                    }
                    return acc;
                  },
                  0
                );
              }
            }
          }
        } else {
          if (salaryCalculationAct == 'F' || salaryCalculationAct == 'W') {
            const notpaiddata =
              salaryCalculationAct == 'F'
                ? calculatedAttendanceData.filter((e) =>
                    [5, 18, 7, 22, 28].includes(e['hrLeaveType.LeaveID'])
                  )
                : calculatedAttendanceData.filter((e) =>
                    [5, 18, 7, 9, 22, 28].includes(e['hrLeaveType.LeaveID'])
                  );

            const sumOfWeekoff =
              salaryCalculationAct == 'F'
                ? weekoffHoliday
                    .filter((e) => e.tableName == 'weekoff')
                    .reduce((acc, obj) => acc + +obj.value, 0)
                : weekoffHoliday.reduce((acc, obj) => acc + +obj.value, 0);

            salary_CalculationDays = +monday - +sumOfWeekoff;

            const userabsentday = notpaiddata.reduce(
              (acc, obj) => acc + +obj.AttnVal,
              0
            );

            usertotalpresentday =
              +totaldays - +userabsentday > 0 ? +totaldays - +userabsentday : 0;
          } else {
            salary_CalculationDays = Number(monday);

            const excludedLeaveIDs = [5, 18, 22, 28];

            usertotalpresentday = calculatedAttendanceData.reduce(
              (acc, obj) => {
                if (!excludedLeaveIDs.includes(obj['hrLeaveType.LeaveID'])) {
                  return acc + Number(obj.AttnVal);
                }
                return acc;
              },
              0
            );
          }
        }

        if (
          calculatedAttendanceData[0].monthstartdate &&
          calculatedAttendanceData[0].monthenddate
        ) {
          start_date = calculatedAttendanceData[0].monthstartdate;
          end_date = calculatedAttendanceData[0].monthenddate;
        }

        const salaryStructureBaseoncal = salarystructure[0].baseOnCalculation;

        // Attendance Data
        let attendanceTransData = [];

        // Fetch attendance data only if any salary structure field is set to depends on physical presence
        if (
          salarystructure.find((e) => e.salaryFieldAttanChk == 2) ||
          salaryStructureBaseoncal == 'H' ||
          salary_calculation_wise == 'hourwise' ||
          LCEGPenaltyData.find(
            (e) => e.penaltyType == LCEGPenaltyTypeEnum.MINUTE
          )
        ) {
          attendanceTransData = await getAttendanceData(
            usermaster[i].userMasterID,
            start_date,
            end_date,
            false
          );
        }

        // check pf/esic Applicable or not on overtime

        let pfApplicable = '';
        let esicApplicable = '';

        if (userAttendacepolicy) {
          pfApplicable = userAttendacepolicy.pfApplicable;
          esicApplicable = userAttendacepolicy.esicApplicable;
        }

        const userLateComeEarlyGoPolicy = await employeeLateEarlyPolicy(
          usermaster[i].userMasterID,
          end_date
        );

        let PenaltyInSalary = 0;

        if (userLateComeEarlyGoPolicy) {
          const salarydetails = {
            salaryStructureBaseoncal: salaryStructureBaseoncal,
            gross: gross,
            salary_CalculationDays: salary_CalculationDays,
          };

          PenaltyInSalary = await calculatePenaltyInSalary(
            userLateComeEarlyGoPolicy,
            salarydetails,
            usermaster[i].userMasterID,
            start_date,
            end_date
          );
        }

        // start transaction
        await sequelize.transaction(async (t) => {
          const [advanceData, loanData, incentiveData, penaltydata, overtime] =
            await Promise.all([
              advancePayment.findAll({
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  paymentYearMonth: yearmonth,
                  status: 1,
                  AdvanceStatus: 1,
                },
                attributes: ['advancePaymentID', 'amount'],
                include: [{ model: EmployeeRepayment, attributes: ['amount'] }],
              }),
              LoanTransactions.findAll({
                raw: true,
                where: {
                  EMIMonth: yearmonth,
                  status: 1,
                },
                include: [
                  {
                    required: true,
                    model: LoanMaster,
                    where: {
                      userMasterID: usermaster[i].userMasterID,
                      status: 1,
                      loanstatus: 1,
                    },
                    attributes: [],
                  },
                ],
                attributes: ['LoanTrasactionId', 'EMIAmount'],
              }),
              Employeeincentive.findAll({
                raw: true,
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  // yearmonth: yearmonth,
                  incentiveDate: {
                    [Sequelize.Op.between]: [start_date, end_date],
                  },
                  status: 1,
                },
                include: [
                  { model: Incentivetype, where: { showinsalaryslip: 'true' } },
                ],
              }),
              EmployeePenalty.findAll({
                raw: true,
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  status: 1,
                  penaltyDate: {
                    [Sequelize.Op.between]: [start_date, end_date],
                  },
                  employeePenaltyID: {
                    [Sequelize.Op.notIn]: Sequelize.literal(`(
                                        SELECT DISTINCT "employeePenaltyID" FROM "employeeRepayments" WHERE "employeePenaltyID" in (SELECT "employeePenaltyID" from "employeePenalties" as emp LEFT join
                                        "penalties" as pe on emp."penaltyID" = pe."penaltyID" where "userMasterID" = ${usermaster[i].userMasterID} and emp.status=1 and pe."deductionFromSalary" = TRUE and emp."penaltyDate" BETWEEN '${start_date}' AND '${end_date}')
                                    )`),
                  },
                },
                include: [
                  {
                    required: true,
                    model: Penalty,
                    as: 'penalty',
                    where: { deductionFromSalary: 'TRUE' },
                    attributes: [],
                  },
                ],
                attributes: [
                  'employeePenaltyID',
                  'penaltyID',
                  [Sequelize.col('penalty.penaltyName'), 'penaltyName'],
                  ['penaltyAmount', 'amount'],
                ],
              }),
              overTimeCalculationMain.findOne({
                raw: true,
                where: {
                  userMasterID: usermaster[i].userMasterID,
                  yyyymm: yearmonth,
                },
              }),
            ]);

          // Deposit Data

          const depositToDeduction = usermaster[i].deposits.length
            ? [...usermaster[i].deposits].filter(
                (e) =>
                  e.depositReceiveAs == 'salary' && e.salaryMonth == yearmonth
              )
            : [];

          const depositToPay = [];

          const depositToDeductionArray = [];
          const depositToPayArray = [];

          // TO get Remaining Days of Month

          let Remaing_Weekoff_Holiday = 0;

          if (salaryCalculationAct == 'F' || salaryCalculationAct == 'W') {
            const actaulEarnigWeekoff = AllcalculatedAttendanceData.filter(
              (e) => e['hrLeaveType.LeaveID'] == 30
            ).reduce((acc, obj) => acc + +obj.AttnVal, 0);
            const actaulEarnigHoliday = AllcalculatedAttendanceData.filter(
              (e) => e['hrLeaveType.LeaveID'] == 31
            ).reduce((acc, obj) => acc + +obj.AttnVal, 0);

            const actualWeekoff = weekoffHoliday
              .filter((e) => e.tableName == 'weekoff')
              .reduce((acc, obj) => acc + +obj.value, 0);

            const actualHoliday = weekoffHoliday
              .filter((e) => e.tableName == 'holiday')
              .reduce((acc, obj) => acc + +obj.value, 0);

            Remaing_Weekoff_Holiday =
              salaryCalculationAct == 'F'
                ? +actualWeekoff - +actaulEarnigWeekoff
                : +actualWeekoff -
                  +actaulEarnigWeekoff +
                  (+actualHoliday - +actaulEarnigHoliday);
          }

          const remainingDays =
            +monday - (+totaldays + +Remaing_Weekoff_Holiday) > 0
              ? +monday - (+totaldays + +Remaing_Weekoff_Holiday)
              : 0;

          // leaveEncashIds
          let finalEncashIds = [];

          let BonusPayData = null,
            addCurrentBonusId = false,
            BonusIds = [];

          // month wise salary calculation
          if (salarystructure[0].baseOnCalculation == 'M') {
            let incentiveArray = [];
            let finalinsentivearray = [];
            let finalpenaltyarray = [];
            let overtimeArray = [];

            let overtimeAmount = 0;
            let esicIncentiveAmount = 0;
            let pfIncentiveAmount = 0;
            let toShowOT = '',
              OtherEmployee_ESIC_Amount = 0,
              OtherEmployer_ESIC_Amount = 0,
              ESIC_CalculatedOn_Amount = 0;

            for (let j = 0; j < salarystructure.length; j++) {
              let finalsalary = 0;

              if (salarystructure[j].payheadMasterId == 16) {
                //Advance

                finalsalary = advanceData.reduce((acc, item) => {
                  const childSum = (item.employeeRepayments || []).reduce(
                    (sum, child) => sum + +child.amount,
                    0
                  );
                  return acc + (+item.amount - +childSum);
                }, 0);

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: finalsalary > 0 ? Math.round(finalsalary) : 0,
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 17) {
                //Loan

                finalsalary = loanData.reduce(
                  (acc, obj) => acc + +obj.EMIAmount,
                  0
                );

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 24) {
                // Incentive

                let incentive = incentiveData;

                let incentiveid = [];
                let amountarray = [];
                if (incentive.length > 0) {
                  for (let a = 0; a < incentive.length; a++) {
                    amountarray.push(+incentive[a].amount);

                    const incentiveName = incentive[a][
                      'incentivetype.inc_type_displayName'
                    ]
                      ? incentive[a]['incentivetype.inc_type_displayName']
                      : incentive[a]['incentivetype.incentivetypename'];

                    // FOR ESIC
                    if (
                      incentive[a]['incentivetype.esicApplicable'] == 'true'
                    ) {
                      OtherEmployee_ESIC_Amount +=
                        (+incentive[a].amount *
                          +incentive[a]['incentivetype.employeeESICPer']) /
                        100;
                      OtherEmployer_ESIC_Amount +=
                        (+incentive[a].amount *
                          +incentive[a]['incentivetype.employerESICPer']) /
                        100;
                      ESIC_CalculatedOn_Amount += +incentive[a].amount;
                    }

                    let find_id = incentiveid.filter((e) => {
                      return e == incentive[a].IncentivetypeID;
                    });

                    if (find_id.length > 0) {
                      let p_Array = incentiveArray.filter((e) => {
                        return e.incentiveid == incentive[a].IncentivetypeID;
                      });

                      let totalAmount =
                        Number(p_Array[0].employeeAmount) +
                        Number(incentive[a].amount);

                      if (incentive[a]['incentivetype.consider'] == 'gross') {
                        if (
                          incentive[a]['incentivetype.pfApplicable'] == 'true'
                        ) {
                          pfIncentiveAmount =
                            +pfIncentiveAmount + +incentive[a].amount;
                        }

                        if (
                          incentive[a]['incentivetype.esicApplicable'] == 'true'
                        ) {
                          esicIncentiveAmount =
                            +esicIncentiveAmount + +incentive[a].amount;
                        }

                        userSalaryArray = userSalaryArray.filter((e) => {
                          return e.incentiveid != incentive[a].IncentivetypeID;
                        });

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName: incentiveName,
                          employeeAmount: Math.round(totalAmount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          incentiveid: incentive[a].IncentivetypeID,
                        });
                      }

                      incentiveArray = incentiveArray.filter((e) => {
                        return e.incentiveid != incentive[a].IncentivetypeID;
                      });

                      incentiveArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: incentiveName,
                        employeeAmount: Math.round(totalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        incentiveid: incentive[a].IncentivetypeID,
                      });
                    } else {
                      incentiveid.push(incentive[a].IncentivetypeID);

                      if (incentive[a]['incentivetype.consider'] == 'gross') {
                        if (
                          incentive[a]['incentivetype.pfApplicable'] == 'true'
                        ) {
                          pfIncentiveAmount =
                            +pfIncentiveAmount + +incentive[a].amount;
                        }

                        if (
                          incentive[a]['incentivetype.esicApplicable'] == 'true'
                        ) {
                          esicIncentiveAmount =
                            +esicIncentiveAmount + +incentive[a].amount;
                        }

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName: incentiveName,
                          employeeAmount: Math.round(incentive[a].amount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          incentiveid: incentive[a].IncentivetypeID,
                        });
                      }

                      incentiveArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: incentiveName,
                        employeeAmount: Math.round(incentive[a].amount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        incentiveid: incentive[a].IncentivetypeID,
                      });
                    }
                  }

                  let finalamount = amountarray.reduce((acc, obj) => {
                    return acc + obj;
                  }, 0);

                  finalinsentivearray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalamount),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                    incentiveid: null,
                  });
                } else {
                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                }
              } else if (salarystructure[j].payheadMasterId == 34) {
                // Penalty

                let penaltyid = [];
                let amountarray = [];

                if (penaltydata.length > 0) {
                  for (let b = 0; b < penaltydata.length; b++) {
                    amountarray.push(+penaltydata[b].amount);

                    let find_id = penaltyid.filter((e) => {
                      return e == penaltydata[b].penaltyID;
                    });

                    if (find_id.length > 0) {
                      let p_Array = userSalaryArray.filter((e) => {
                        return e.penaltyid == penaltydata[b].penaltyID;
                      });

                      userSalaryArray = userSalaryArray.filter((e) => {
                        return e.penaltyid != penaltydata[b].penaltyID;
                      });

                      let totalAmount =
                        Number(p_Array[0].employeeAmount) +
                        Number(penaltydata[b].amount);

                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: penaltydata[b].penaltyName,
                        employeeAmount: Math.round(totalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        penaltyid: penaltydata[b].penaltyID,
                      });
                    } else {
                      penaltyid.push(penaltydata[b].penaltyID);

                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: penaltydata[b].penaltyName,
                        employeeAmount: Math.round(penaltydata[b].amount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        penaltyid: penaltydata[b].penaltyID,
                      });
                    }
                  }

                  let finalamount = amountarray.reduce((acc, obj) => {
                    return acc + obj;
                  }, 0);

                  finalpenaltyarray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalamount),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                    penaltyid: null,
                  });
                } else {
                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                }
              } else if (salarystructure[j].payheadMasterId == 9) {
                // TDS

                let tdsAmount = 0;

                if (usermaster[i].companyMaster.tdsdeduction == true) {
                  const financialYear =
                    await getFinancialYearByMonth(yearmonth);

                  const incomeTaxData = (
                    await incomeTaxCalculationByUserId(
                      usermaster[i].userMasterID,
                      financialYear
                    )
                  ).data.find((e) => e.yearMonth == yearmonth);

                  tdsAmount = incomeTaxData ? +incomeTaxData.amount : 0;
                }

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount:
                    salarystructure[j].salaryFieldRound == 'N'
                      ? +tdsAmount % 1 == 0
                        ? +tdsAmount
                        : +tdsAmount.toFixed(2)
                      : Math.round(+tdsAmount),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 43) {
                // Overtime

                if (
                  salarystructure[j].salaryFieldShow == 'Y' &&
                  overtime &&
                  userAttendacepolicy
                ) {
                  let showinsalaryslip = userAttendacepolicy.showinsalaryslip;

                  let consider = userAttendacepolicy.consider;

                  if (showinsalaryslip == 'true') {
                    overtime_min = +overtime.overtimehrs;
                    toShowOT = userAttendacepolicy.toShowOT;
                    overtimeAmount = Number(overtime.TotalAmount);

                    //For ESIC
                    if (esicApplicable == 'true') {
                      OtherEmployee_ESIC_Amount +=
                        (+overtimeAmount *
                          +userAttendacepolicy.employeeESICPer) /
                        100;
                      OtherEmployer_ESIC_Amount +=
                        (+overtimeAmount *
                          +userAttendacepolicy.employerESICPer) /
                        100;
                      ESIC_CalculatedOn_Amount += +overtimeAmount;
                    }

                    if (consider == 'gross') {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: Number(overtime.TotalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                      });
                    } else {
                      overtimeArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: Number(overtime.TotalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                      });
                    }
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: 0,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                    });
                  }
                } else {
                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                }
              } else if (salarystructure[j].payheadMasterId == 15) {
              } else if (salarystructure[j].payheadMasterId == 13) {
              } else if (salarystructure[j].payheadMasterId == 14) {
              } else if (salarystructure[j].payheadMasterId == 78) {
                // penalty data

                finalsalary = penaltyDeductionCalculation(
                  LCEGPenaltyData,
                  attendanceTransData,
                  salary_CalculationDays,
                  gross,
                  salaryStructureBaseoncal,
                  salary_calculation_wise
                );

                finalsalary += PenaltyInSalary;

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 96) {
                // Deposit to deduction from salary
                finalsalary = depositToDeduction.reduce(
                  (acc, obj) => acc + +obj.amount,
                  0
                );

                const result = Object.values(
                  depositToDeduction.reduce((acc, curr) => {
                    if (!acc[curr.depositcategory.depositcategoryname]) {
                      acc[curr.depositcategory.depositcategoryname] = {
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: curr.depositcategory.depositcategoryname,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange: null,
                      };
                    }
                    acc[
                      curr.depositcategory.depositcategoryname
                    ].employeeAmount += curr.amount; // Sum the amount
                    return acc;
                  }, {})
                );

                userSalaryArray = [...userSalaryArray, ...result];

                depositToDeductionArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: null,
                });
              } else if (salarystructure[j].payheadMasterId == 97) {
                // Deposit to pay in salary
                finalsalary = depositToPay.reduce(
                  (acc, obj) => acc + +obj.amount,
                  0
                );

                const result = Object.values(
                  depositToPay.reduce((acc, curr) => {
                    if (!acc[curr.depositcategory.depositcategoryname]) {
                      acc[curr.depositcategory.depositcategoryname] = {
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: curr.depositcategory.depositcategoryname,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange: null,
                      };
                    }
                    acc[
                      curr.depositcategory.depositcategoryname
                    ].employeeAmount += curr.amount; // Sum the amount
                    return acc;
                  }, {})
                );

                userSalaryArray = [...userSalaryArray, ...result];

                depositToPayArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: null,
                });
              } else if (salarystructure[j].payheadMasterId == 67) {
                // Leave Encashment

                const { amount, encashIds } = calculateLeaveEncashment(
                  allEmployeeLeavePolicy,
                  AllHrleaveTypes,
                  employeeLeaveEncashment,
                  AllsalarystructureData,
                  salary_calculation_wise,
                  salary_CalculationDays
                );

                // set encashids
                finalEncashIds = encashIds;

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(amount),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: null,
                });
              } else if (salarystructure[j].payheadMasterId == 101) {
                BonusPayData = salarystructure[j];
              } else {
                // check depends on att

                if (salarystructure[j].salaryFieldAttanChk == 0) {
                  finalsalary = +salarystructure[j].ActualEmployeeSalaryAmount;
                } else if (salarystructure[j].salaryFieldAttanChk == 2) {
                  // if physical Attndance

                  finalsalary =
                    (Math.round(
                      +salarystructure[j].ActualEmployeeSalaryAmount
                    ) /
                      31) *
                    +attendanceTransData.length;
                } else {
                  if (salary_calculation_wise == 'hourwise') {
                    let oneminutesalry =
                      Number(salarystructure[j].ActualEmployeeSalaryAmount) /
                      Number(salary_CalculationDays);

                    finalsalary =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                  } else {
                    let onedaysalary =
                      Number(salarystructure[j].ActualEmployeeSalaryAmount) /
                      Number(salary_CalculationDays);

                    finalsalary = LWP_flag
                      ? +salarystructure[j].ActualEmployeeSalaryAmount
                      : +salarystructure[j].ActualEmployeeSalaryAmount -
                        Number(onedaysalary) * (+remainingDays + +unpaidDays);

                    if (+finalsalary < 0) finalsalary = 0;
                  }
                }

                // pf

                if (
                  salarystructure[j].payheadMasterId == 4 ||
                  salarystructure[j].payheadMasterId == 5 ||
                  salarystructure[j].payheadMasterId == 12 ||
                  salarystructure[j].payheadMasterId == 25 ||
                  salarystructure[j].payheadMasterId == 66
                ) {
                  let pf = 0;

                  if ([4, 12].includes(salarystructure[j].payheadMasterId)) {
                    pf =
                      (Number(salarystructure[j].ActualEmployeeSalaryAmount) *
                        100) /
                      (salarystructure[j].payheadMasterId == 4 ? 12 : 8.33);
                  }

                  let calculatedOn =
                    (Number(pf) / Number(salary_CalculationDays)) *
                    (salary_calculation_wise == 'hourwise'
                      ? Number(usertotalpresentday)
                      : salary_CalculationDays -
                        (+remainingDays + +unpaidDays));

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: +finalsalary,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: [4, 12].includes(
                      salarystructure[j].payheadMasterId
                    )
                      ? +calculatedOn
                      : null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                    salaryFieldRound: salarystructure[j].salaryFieldRound,
                    salaryFieldRoundNo: salarystructure[j].salaryFieldRoundNo,
                    roundOffType: salarystructure[j].roundOffType,
                    considerIn: salarystructure[j].considerIn,
                  });
                } else {
                  // check salary field round

                  if (salarystructure[j].salaryFieldRound == 'Y') {
                    finalsalary =
                      salarystructure[j].roundOffType == 0
                        ? Math.ceil(finalsalary.toFixed(2))
                        : Math.round(finalsalary);
                  } else {
                    let salaryfieldroundno = Number(
                      !salarystructure[j].salaryFieldRoundNo
                        ? 0
                        : salarystructure[j].salaryFieldRoundNo
                    );
                    finalsalary = Number(
                      finalsalary.toFixed(salaryfieldroundno)
                    );
                  }
                  if (salarystructure[j].salaryFieldWhenMonth[0] != 0) {
                    let currentmonth = Month;

                    if (Number(currentmonth) < 10) {
                      currentmonth = Month.slice(1);
                    }

                    let whencalculation =
                      salarystructure[j].salaryFieldWhenMonth;
                    whencalculation = whencalculation.filter((s) => {
                      return s == currentmonth;
                    });

                    if (whencalculation.length > 0) {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: finalsalary,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        considerIn: salarystructure[j].considerIn,
                      });
                    } else {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        considerIn: salarystructure[j].considerIn,
                      });
                    }
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: finalsalary,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                      considerIn: salarystructure[j].considerIn,
                    });
                  }
                }
              }
            }

            // ----------------------Bonus Pay Calculation ---------------------------------------
            if (BonusPayData) {
              const currentBonusAmount =
                userSalaryArray.find((e) => e.payheadmasterid == 6)
                  ?.employeeAmount || 0;

              const { amount, ids, addcurrentId } = await getPayBonusAmount(
                bonusPolicy,
                yearmonth,
                currentBonusAmount,
                usermaster[i].userMasterID
              );

              BonusIds = ids;
              addCurrentBonusId = addcurrentId;

              userSalaryArray.push({
                salaryMasterID: BonusPayData.salaryMasterID,
                payheadmasterid: BonusPayData.payheadMasterId,
                payheadName:
                  BonusPayData.payheadDisplayName &&
                  BonusPayData.payheadDisplayName.trim()
                    ? BonusPayData.payheadDisplayName.trim()
                    : BonusPayData.payheadName,
                employeeAmount: Math.round(+amount),
                salaryfieldsrno: BonusPayData.salaryFieldSrNo,
                salaryfieldside: BonusPayData.salaryFieldSide,
                salaryfieldshow: BonusPayData.salaryFieldShow,
                calculatedOn: null,
                salaryfieldmaxrange: BonusPayData.salaryfieldmaxrange,
                considerIn: BonusPayData.considerIn,
              });
            }

            //----------------- Push LWP Deduction in salary array------

            if (lwp_deduction) {
              const amount =
                LWP_flag && salary_calculation_wise != 'hourwise'
                  ? (+gross / +salary_CalculationDays) *
                    (+remainingDays + +unpaidDays)
                  : 0;

              userSalaryArray.push({
                salaryMasterID: lwp_deduction.salaryMasterID,
                payheadmasterid: lwp_deduction.payheadMasterId,
                payheadName:
                  lwp_deduction.payheadDisplayName &&
                  lwp_deduction.payheadDisplayName.trim()
                    ? lwp_deduction.payheadDisplayName.trim()
                    : lwp_deduction.payheadName,
                employeeAmount:
                  lwp_deduction.salaryFieldRound == 'N' && +amount % 1 != 0
                    ? +amount.toFixed(+lwp_deduction.salaryFieldRoundNo)
                    : Math.round(+amount),
                salaryfieldsrno: lwp_deduction.salaryFieldSrNo,
                salaryfieldside: lwp_deduction.salaryFieldSide,
                salaryfieldshow: lwp_deduction.salaryFieldShow,
                calculatedOn: null,
                salaryfieldmaxrange: lwp_deduction.salaryfieldmaxrange,
                considerIn: lwp_deduction.considerIn,
              });
            }

            // deduct pf on overtime

            if (pfApplicable == 'true' || +pfIncentiveAmount > 0) {
              let pfDeductionAmount = 0;
              if (pfApplicable != 'true') {
                pfDeductionAmount = +pfIncentiveAmount;
              } else {
                pfDeductionAmount = +overtimeAmount + +pfIncentiveAmount;
              }

              userSalaryArray.forEach((e) => {
                if (
                  e.payheadmasterid == 4 ||
                  e.payheadmasterid == 5 ||
                  e.payheadmasterid == 12 ||
                  e.payheadmasterid == 25 ||
                  e.payheadmasterid == 66
                ) {
                  const amount =
                    Number(e.employeeAmount) +
                    (e.payheadmasterid == 4
                      ? (Number(pfDeductionAmount) * 12) / 100
                      : e.payheadmasterid == 5
                        ? (Number(pfDeductionAmount) * 3.67) / 100
                        : e.payheadmasterid == 12
                          ? (Number(pfDeductionAmount) * 8.33) / 100
                          : (Number(pfDeductionAmount) * 0.5) / 100);

                  e.employeeAmount =
                    e.salaryFieldRound == 'Y'
                      ? e.roundOffType == 0
                        ? Math.ceil(amount.toFixed(2))
                        : Math.round(amount)
                      : !e.salaryFieldRound
                        ? Math.round(amount)
                        : amount.toFixed(+e.salaryFieldRoundNo);

                  if ([4, 12].includes(e.payheadmasterid))
                    e.calculatedOn = Math.round(
                      Number(e.calculatedOn) + Number(pfDeductionAmount)
                    );
                }
              });
            } else {
              // if not

              userSalaryArray.forEach((e) => {
                if (
                  e.payheadmasterid == 4 ||
                  e.payheadmasterid == 5 ||
                  e.payheadmasterid == 12 ||
                  e.payheadmasterid == 25 ||
                  e.payheadmasterid == 66
                ) {
                  // const amount = Number(e.employeeAmount);

                  e.employeeAmount =
                    e.salaryFieldRound == 'Y'
                      ? e.roundOffType == 0
                        ? Math.ceil((+e.employeeAmount).toFixed(2))
                        : Math.round(+e.employeeAmount)
                      : !e.salaryFieldRound
                        ? Math.round(+e.employeeAmount)
                        : (+e.employeeAmount).toFixed(+e.salaryFieldRoundNo);

                  if ([4, 12].includes(e.payheadmasterid))
                    e.calculatedOn = Math.round(Number(e.calculatedOn));
                }
              });
            }

            let ot_payheadMasterId,
              toAddOTInOtherPathead = false;

            // if attendancepolicy has show ot as add in payhead

            if (
              userAttendacepolicy &&
              userAttendacepolicy.toShowOT == 'addInPayhead'
            ) {
              ot_payheadMasterId = userAttendacepolicy.payheadMasterId;
              // Check if payhead id is  present or not in structure
              toAddOTInOtherPathead = userSalaryArray.find(
                (e) => +e.payheadmasterid == +ot_payheadMasterId
              )
                ? true
                : false;
              // If present then add Amount
              if (toAddOTInOtherPathead) {
                userSalaryArray = userSalaryArray.map((e) => {
                  if (+e.payheadmasterid == +ot_payheadMasterId)
                    e.employeeAmount += +overtimeAmount;
                  if (+e.payheadmasterid == 43) e.employeeAmount = 0;
                  return e;
                });
                // Set OT Array Empty
                overtimeArray = [];
              }
            }

            // set max range

            userSalaryArray.map((e) => {
              if (e.salaryfieldmaxrange) {
                if (+e.salaryfieldmaxrange < +e.employeeAmount) {
                  // pf
                  if (e.payheadmasterid == 4) {
                    e.calculatedOn = Math.round(
                      (+e.salaryfieldmaxrange * 100) / 12
                    );
                  }
                  // EPS
                  if (e.payheadmasterid == 12) {
                    e.calculatedOn =
                      +e.salaryfieldmaxrange == 1250
                        ? 15000
                        : Math.round((+e.salaryfieldmaxrange * 100) / 8.33);
                  }

                  e.employeeAmount = +e.salaryfieldmaxrange;
                }
              }
            });

            // ----------------------------- calculate EPF Amount  ---------------------------

            if (EPF_Data) {
              const PF_amount =
                userSalaryArray.find((e) => e.payheadmasterid == 4)
                  ?.employeeAmount || 0;
              const EPS_amount =
                userSalaryArray.find((e) => e.payheadmasterid == 12)
                  ?.employeeAmount || 0;

              const amount1 =
                +PF_amount - +EPS_amount > 0 ? +PF_amount - +EPS_amount : 0;

              const employeeAmount =
                EPF_Data.salaryFieldRound == 'Y'
                  ? EPF_Data.roundOffType == 0
                    ? Math.ceil((+amount1).toFixed(2))
                    : Math.round(+amount1)
                  : !EPF_Data.salaryFieldRound
                    ? Math.round(+amount1)
                    : (+amount1).toFixed(+EPF_Data.salaryFieldRoundNo);

              userSalaryArray.push({
                salaryMasterID: EPF_Data.salaryMasterID,
                payheadmasterid: EPF_Data.payheadMasterId,
                payheadName:
                  EPF_Data.payheadDisplayName &&
                  EPF_Data.payheadDisplayName.trim()
                    ? EPF_Data.payheadDisplayName.trim()
                    : EPF_Data.payheadName,
                employeeAmount,
                salaryfieldsrno: EPF_Data.salaryFieldSrNo,
                salaryfieldside: EPF_Data.salaryFieldSide,
                salaryfieldshow: EPF_Data.salaryFieldShow,
                calculatedOn: null,
                salaryfieldmaxrange: EPF_Data.salaryfieldmaxrange,
                considerIn: EPF_Data.considerIn,
              });
            }

            employee_gross = userSalaryArray
              .filter(
                (e) =>
                  e.salaryfieldsrno == 'A' &&
                  e.salaryfieldshow == 'Y' &&
                  e.considerIn != 'net'
              )
              .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

            let employee_otherAmount = 0;

            userSalaryArray.filter((s) => {
              if (
                s.salaryfieldside == 'D' &&
                s.salaryfieldsrno != 'C' &&
                s.employeeAmount != 0 &&
                s.salaryfieldshow == 'Y'
              ) {
                employee_otherAmount = employee_otherAmount + +s.employeeAmount;
              }
            });

            // add amount in net pay
            employee_extraAddInNetPay = userSalaryArray
              .filter(
                (e) =>
                  e.salaryfieldsrno == 'A' &&
                  e.salaryfieldshow == 'Y' &&
                  e.considerIn == 'net'
              )
              .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

            employee_netPay =
              Number(employee_gross) -
              Number(employee_otherAmount) +
              +employee_extraAddInNetPay;

            // employee PT
            const ptdata = salarystructure.filter((s) => {
              return s.payheadMasterId == 15;
            });

            if (ptdata.length > 0) {
              let get_one_data1 = await ProfessionalTaxSlabMaster.findOne({
                where: {
                  stateMasterID: +ptdata[0].stateid,
                  fromAmount: { [Sequelize.Op.lte]: +employee_gross },
                  toAmount: { [Sequelize.Op.gte]: +employee_gross },
                  status: 1,
                  month: +Month,
                  applicableFromYYYYMM: {
                    [Sequelize.Op.lte]: String(yearmonth),
                  },
                },
                order: [['applicableFromYYYYMM', 'DESC']],
              });

              let value;
              if (get_one_data1) {
                if (usermaster[i].gender == 'female') {
                  value = get_one_data1.femaleTax;
                } else {
                  value = get_one_data1.maleTax;
                }
              } else {
                value = 0;
              }

              userSalaryArray.push({
                salaryMasterID: ptdata[0].salaryMasterID,
                payheadmasterid: ptdata[0].payheadMasterId,
                payheadName:
                  ptdata[0].payheadDisplayName &&
                  ptdata[0].payheadDisplayName.trim()
                    ? ptdata[0].payheadDisplayName.trim()
                    : ptdata[0].payheadName,
                employeeAmount: +value,
                salaryfieldsrno: ptdata[0].salaryFieldSrNo,
                salaryfieldside: ptdata[0].salaryFieldSide,
                salaryfieldshow: ptdata[0].salaryFieldShow,
                calculatedOn: null,
              });

              employee_netPay = Number(employee_netPay) - Number(value);
            }

            // employee esic

            const esicdata = salarystructure.filter((s) => {
              return s.payheadMasterId == 13;
            });

            if (esicdata.length > 0) {
              if (Number(esicdata[0].EmployeeSalaryAmount) > 0) {
                let value = 0,
                  calculatedOn = 0;

                if (esicDeduction == true) {
                  if (salary_calculation_wise == 'hourwise') {
                    let oneminutesalry =
                      Number(esicdata[0].ActualEmployeeSalaryAmount) /
                      Number(salary_CalculationDays);

                    value =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                  } else {
                    let onedaysalary =
                      Number(esicdata[0].ActualEmployeeSalaryAmount) /
                      Number(salary_CalculationDays);

                    value =
                      +esicdata[0].ActualEmployeeSalaryAmount -
                      Number(onedaysalary) * (+remainingDays + +unpaidDays);
                  }

                  const esic =
                    (Number(esicdata[0].ActualEmployeeSalaryAmount) * 100) /
                    0.75;

                  calculatedOn =
                    (Number(esic) / Number(salary_CalculationDays)) *
                    (salary_calculation_wise == 'hourwise'
                      ? Number(usertotalpresentday)
                      : salary_CalculationDays -
                        (+remainingDays + +unpaidDays));

                  value += +OtherEmployee_ESIC_Amount;
                  calculatedOn += +ESIC_CalculatedOn_Amount;

                  // check max range

                  if (esicdata[0].salaryfieldmaxrange) {
                    if (+value > +esicdata[0].salaryfieldmaxrange) {
                      value = +esicdata[0].salaryfieldmaxrange;
                    }
                  }

                  value =
                    esicdata[0].salaryFieldRound == 'Y'
                      ? esicdata[0].roundOffType == 0
                        ? Math.ceil(value.toFixed(2))
                        : Math.round(value)
                      : !esicdata[0].salaryFieldRound
                        ? Math.round(value)
                        : value.toFixed(+esicdata[0].salaryFieldRoundNo);
                }

                userSalaryArray.push({
                  salaryMasterID: esicdata[0].salaryMasterID,
                  payheadmasterid: esicdata[0].payheadMasterId,
                  payheadName:
                    esicdata[0].payheadDisplayName &&
                    esicdata[0].payheadDisplayName.trim()
                      ? esicdata[0].payheadDisplayName.trim()
                      : esicdata[0].payheadName,
                  employeeAmount: +value,
                  salaryfieldsrno: esicdata[0].salaryFieldSrNo,
                  salaryfieldside: esicdata[0].salaryFieldSide,
                  salaryfieldshow: esicdata[0].salaryFieldShow,
                  calculatedOn:
                    +calculatedOn > 0 ? Math.round(calculatedOn) : null,
                });

                employee_netPay = Number(employee_netPay) - Number(value);
              }
            }

            // company esic

            const co_esicdata = salarystructure.filter((s) => {
              return s.payheadMasterId == 14;
            });

            if (co_esicdata.length > 0) {
              if (Number(co_esicdata[0].EmployeeSalaryAmount) > 0) {
                let value = 0;

                if (esicDeduction == true) {
                  if (salary_calculation_wise == 'hourwise') {
                    let oneminutesalry =
                      Number(co_esicdata[0].EmployeeSalaryAmount) /
                      Number(salary_CalculationDays);

                    value =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                  } else {
                    let onedaysalary =
                      Number(co_esicdata[0].ActualEmployeeSalaryAmount) /
                      Number(salary_CalculationDays);

                    value =
                      +co_esicdata[0].ActualEmployeeSalaryAmount -
                      Number(onedaysalary) * (+remainingDays + +unpaidDays);
                  }

                  //SUM Of ESIC
                  value += +OtherEmployer_ESIC_Amount;

                  // max range

                  if (co_esicdata[0].salaryfieldmaxrange) {
                    if (+value > +co_esicdata[0].salaryfieldmaxrange) {
                      value = +co_esicdata[0].salaryfieldmaxrange;
                    }
                  }

                  value =
                    co_esicdata[0].salaryFieldRound == 'Y'
                      ? co_esicdata[0].roundOffType == 0
                        ? Math.ceil(value.toFixed(2))
                        : Math.round(value)
                      : !co_esicdata[0].salaryFieldRoundNo
                        ? Math.round(value)
                        : value.toFixed(+co_esicdata[0].salaryFieldRoundNo);
                }

                userSalaryArray.push({
                  salaryMasterID: co_esicdata[0].salaryMasterID,
                  payheadmasterid: co_esicdata[0].payheadMasterId,
                  payheadName:
                    co_esicdata[0].payheadDisplayName &&
                    co_esicdata[0].payheadDisplayName.trim()
                      ? co_esicdata[0].payheadDisplayName.trim()
                      : co_esicdata[0].payheadName,
                  employeeAmount: +value,
                  salaryfieldsrno: co_esicdata[0].salaryFieldSrNo,
                  salaryfieldside: co_esicdata[0].salaryFieldSide,
                  salaryfieldshow: co_esicdata[0].salaryFieldShow,
                  calculatedOn: null,
                });
              }
            }

            // push incentive
            if (incentiveArray.length > 0) {
              userSalaryArray = userSalaryArray.filter((s) => {
                return s.payheadmasterid != 24;
              });

              userSalaryArray = [...userSalaryArray, ...incentiveArray];
            }

            // push overtime

            if (overtimeArray.length > 0) {
              userSalaryArray = userSalaryArray.filter((s) => {
                return s.payheadmasterid != 43;
              });

              userSalaryArray = [...userSalaryArray, ...overtimeArray];
            }

            let employeefinalsalary = userSalaryArray;

            const EmployerSideDeduction = userSalaryArray
              .filter((s) => s.salaryfieldsrno == 'C')
              .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

            userSalaryArray = userSalaryArray.filter((s) => {
              return s.salaryfieldsrno != 'C' && s.salaryfieldshow == 'Y';
            });

            // show data

            for (let g = 0; g < userSalaryArray.length; g++) {
              if (
                [
                  16, 17, 24, 34, 9, 43, 14, 13, 15, 78, 83, 99, 67, 101,
                ].includes(userSalaryArray[g].payheadmasterid)
              ) {
                if (userSalaryArray[g].employeeAmount != 0) {
                  showusersalary.push(userSalaryArray[g]);
                }
              } else {
                showusersalary.push(userSalaryArray[g]);
              }
            }

            let totalear = 0;
            let totaldedu = 0;
            // for final net pay

            showusersalary.filter((e) => {
              if (e.salaryfieldside == 'E') {
                totalear = totalear + +e.employeeAmount;
              }
            });

            showusersalary.filter((e) => {
              if (e.salaryfieldside == 'D') {
                totaldedu = totaldedu + +e.employeeAmount;
              }
            });

            employee_netPay = Number(totalear) - Number(totaldedu);

            // To check decimal or not

            if (
              +employee_netPay % 1 !== 0 &&
              CTC_GROSS_NET.find((e) => e.payheadMasterId == 92)
                ?.salaryFieldRound == 'N'
            ) {
              employee_netPay = +employee_netPay.toFixed(
                +CTC_GROSS_NET.find((e) => e.payheadMasterId == 92)
                  ?.salaryFieldRoundNo || 0
              );
            } else {
              employee_netPay = Math.round(+employee_netPay);
            }

            if (
              employee_gross % 1 !== 0 &&
              CTC_GROSS_NET.find((e) => e.payheadMasterId == 50)
                ?.salaryFieldRound == 'N'
            ) {
              employee_gross = employee_gross.toFixed(
                +CTC_GROSS_NET.find((e) => e.payheadMasterId == 50)
                  ?.salaryFieldRoundNo || 0
              );
            } else {
              employee_gross = Math.round(+employee_gross);
            }

            let employee_ctc =
              +employee_gross +
              +employee_extraAddInNetPay +
              +EmployerSideDeduction;

            if (
              +employee_ctc % 1 !== 0 &&
              CTC_GROSS_NET.find((e) => e.payheadMasterId == 1)
                ?.salaryFieldRound == 'N'
            ) {
              employee_ctc = +employee_ctc.toFixed(
                +CTC_GROSS_NET.find((e) => e.payheadMasterId == 1)
                  ?.salaryFieldRoundNo || 0
              );
            } else {
              employee_ctc = Math.round(+employee_ctc);
            }

            //--------------------- Add CTC GROSS NET SALARY in salary Data ------------------------------

            CTC_GROSS_NET.forEach((e) => {
              if ([50, 92, 1].includes(e.payheadMasterId)) {
                employeefinalsalary.push({
                  salaryMasterID: e.salaryMasterID,
                  payheadmasterid: e.payheadMasterId,
                  payheadName:
                    e.payheadDisplayName && e.payheadDisplayName.trim()
                      ? e.payheadDisplayName.trim()
                      : e.payheadName,
                  employeeAmount:
                    e.payheadMasterId == 50
                      ? +employee_gross
                      : e.payheadMasterId == 92
                        ? +employee_netPay
                        : +employee_ctc,
                  salaryfieldsrno: e.salaryFieldSrNo,
                  salaryfieldside: e.salaryFieldSide,
                  salaryfieldshow: e.salaryFieldShow,
                  calculatedOn: null,
                });
              }
            });

            // combined incentive

            if (finalinsentivearray.length > 0) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 24;
              });

              employeefinalsalary.push(finalinsentivearray[0]);
            }

            // combined penalty

            if (finalpenaltyarray.length > 0) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 34;
              });

              employeefinalsalary.push(finalpenaltyarray[0]);
            }

            // Final Deposit of deduction
            if (depositToDeductionArray.length) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 96;
              });

              employeefinalsalary.push(depositToDeductionArray[0]);
            }

            // Final Deposit of Pay
            if (depositToPayArray.length) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 97;
              });

              employeefinalsalary.push(depositToPayArray[0]);
            }

            const advanceIds =
              advanceData.length > 0
                ? advanceData.map((e) => e.advancePaymentID)
                : [];
            const loantranIds =
              loanData.length > 0
                ? loanData.map((e) => e.LoanTrasactionId)
                : [];
            const penaltyIds =
              penaltydata.length > 0
                ? penaltydata.map((e) => e.employeePenaltyID)
                : [];
            const incentiveIds =
              incentiveData.length > 0
                ? incentiveData.map((e) => e.employeeincentiveID)
                : [];

            let currentBonusData = null;

            // add salary

            for (let l = 0; l < employeefinalsalary.length; l++) {
              let add_data = await HrSalaryTrans.create(
                {
                  userMasterID: usermaster[i].userMasterID,
                  salaryMasterID: employeefinalsalary[l].salaryMasterID,
                  salaryYYYYMM: yearmonth,
                  EmployeeSalaryPer: 0,
                  EmployeeSalaryAmount: employeefinalsalary[l].employeeAmount,
                  SalaryCalcOnDays: usertotalpresentday,
                  createBy: createBy,
                  createByIp: createByIp,
                  calculatedOn: employeefinalsalary[l].calculatedOn,
                },
                { transaction: t }
              );

              // Bonus
              if (
                employeefinalsalary[l].payheadmasterid == 6 &&
                +employeefinalsalary[l].employeeAmount > 0
              ) {
                currentBonusData = await EmployeeBonus.create(
                  {
                    userMasterID: usermaster[i].userMasterID,
                    amount: Math.round(+employeefinalsalary[l].employeeAmount),
                    bonusYYYYMM: yearmonth,
                    referenceId: add_data.userSalaryTranID,
                  },
                  {
                    user: req.userDetails,
                    transaction: t,
                  }
                );
              }

              // Pay Bonus

              if (
                employeefinalsalary[l].payheadmasterid == 101 &&
                BonusPayData &&
                (BonusIds.length || addCurrentBonusId)
              ) {
                await EmployeeBonus.update(
                  {
                    payReferenceId: add_data.userSalaryTranID,
                    payYYYYMM: yearmonth,
                  },
                  {
                    where: {
                      id: {
                        [Sequelize.Op.in]: BonusIds,
                      },
                    },
                    individualHooks: true,
                    user: req.userDetails,
                    transaction: t,
                  }
                );

                if (addCurrentBonusId && currentBonusData) {
                  await currentBonusData.update(
                    {
                      payReferenceId: add_data.userSalaryTranID,
                      payYYYYMM: yearmonth,
                    },
                    {
                      user: req.userDetails,
                      transaction: t,
                    }
                  );
                }
              }

              //  update Advance
              if (
                employeefinalsalary[l].payheadmasterid == 16 &&
                advanceIds.length > 0
              ) {
                await advancePayments.update(
                  {
                    tablereferenceID: add_data.userSalaryTranID,
                    tableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      advancePaymentID: advanceIds,
                    },
                    transaction: t,
                  }
                );
              }

              // update Loan
              if (
                employeefinalsalary[l].payheadmasterid == 17 &&
                loantranIds.length > 0
              ) {
                await LoanTransactions.update(
                  {
                    RefrenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      LoanTrasactionId: loantranIds,
                    },
                    transaction: t,
                  }
                );
              }

              // update Penalty

              if (
                employeefinalsalary[l].payheadmasterid == 34 &&
                penaltyIds.length > 0
              ) {
                await employeePenalties.update(
                  {
                    RefrenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      employeePenaltyID: penaltyIds,
                    },
                    transaction: t,
                  }
                );
              }

              // update incentive

              if (
                employeefinalsalary[l].payheadmasterid == 24 &&
                incentiveIds.length > 0
              ) {
                await Employeeincentive.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      employeeincentiveID: incentiveIds,
                    },
                    transaction: t,
                  }
                );
              }
              // update overtimecal

              if (
                employeefinalsalary[l].payheadmasterid == 43 &&
                +employeefinalsalary[l].employeeAmount > 0
              ) {
                await OverTimeCalculationMains.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    tableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      userMasterID: usermaster[i].userMasterID,
                      yyyymm: yearmonth,
                    },
                    transaction: t,
                  }
                );
              }

              // update deposits

              if (
                depositToDeduction.length &&
                employeefinalsalary[l].payheadmasterid == 96
              ) {
                await deposit.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      depositId: depositToDeduction.map((e) => e.depositId),
                    },
                    transaction: t,
                  }
                );
              }

              // update deposits

              if (
                depositToPay.length &&
                employeefinalsalary[l].payheadmasterid == 97
              ) {
                await deposit.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      depositId: depositToPay.map((e) => e.depositId),
                    },
                    transaction: t,
                  }
                );
              }

              // update leaveEncashment

              if (
                finalEncashIds.length &&
                employeefinalsalary[l].payheadmasterid == 67
              ) {
                await LeaveEncashment.update(
                  {
                    referenceId: add_data.userSalaryTranID,
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      id: {
                        [Sequelize.Op.in]: finalEncashIds,
                      },
                    },
                    transaction: t,
                  }
                );
              }
            }
          }

          // Day wise salary calculation
          else if (salarystructure[0].baseOnCalculation == 'D') {
            let incentiveArray = [];
            let finalinsentivearray = [];
            let finalpenaltyarray = [];
            let overtimeArray = [];

            let overtimeAmount = 0;
            let pfIncentiveAmount = 0;
            let esicIncentiveAmount = 0;
            let toShowOT = '',
              OtherEmployee_ESIC_Amount = 0,
              OtherEmployer_ESIC_Amount = 0,
              ESIC_CalculatedOn_Amount = 0;

            for (let j = 0; j < salarystructure.length; j++) {
              let finalsalary = 0;

              if (salarystructure[j].payheadMasterId == 16) {
                //Advance

                finalsalary = advanceData.reduce((acc, item) => {
                  const childSum = (item.employeeRepayments || []).reduce(
                    (sum, child) => sum + +child.amount,
                    0
                  );
                  return acc + (+item.amount - +childSum);
                }, 0);

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: finalsalary > 0 ? Math.round(finalsalary) : 0,
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 17) {
                //Loan

                finalsalary = loanData.reduce(
                  (acc, obj) => acc + +obj.EMIAmount,
                  0
                );

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 24) {
                // Incentive

                let incentive = incentiveData;

                let incentiveid = [];
                let amountarray = [];
                if (incentive.length > 0) {
                  for (let a = 0; a < incentive.length; a++) {
                    amountarray.push(+incentive[a].amount);

                    // FOR ESIC
                    if (
                      incentive[a]['incentivetype.esicApplicable'] == 'true'
                    ) {
                      OtherEmployee_ESIC_Amount +=
                        (+incentive[a].amount *
                          +incentive[a]['incentivetype.employeeESICPer']) /
                        100;
                      OtherEmployer_ESIC_Amount +=
                        (+incentive[a].amount *
                          +incentive[a]['incentivetype.employerESICPer']) /
                        100;
                      ESIC_CalculatedOn_Amount += +incentive[a].amount;
                    }

                    let find_id = incentiveid.filter((e) => {
                      return e == incentive[a].IncentivetypeID;
                    });

                    if (find_id.length > 0) {
                      let p_Array = incentiveArray.filter((e) => {
                        return e.incentiveid == incentive[a].IncentivetypeID;
                      });

                      let totalAmount =
                        Number(p_Array[0].employeeAmount) +
                        Number(incentive[a].amount);

                      if (incentive[a]['incentivetype.consider'] == 'gross') {
                        if (
                          incentive[a]['incentivetype.pfApplicable'] == 'true'
                        ) {
                          pfIncentiveAmount =
                            +pfIncentiveAmount + +incentive[a].amount;
                        }

                        if (
                          incentive[a]['incentivetype.esicApplicable'] == 'true'
                        ) {
                          esicIncentiveAmount =
                            +esicIncentiveAmount + +incentive[a].amount;
                        }

                        userSalaryArray = userSalaryArray.filter((e) => {
                          return e.incentiveid != incentive[a].IncentivetypeID;
                        });

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            incentive[a]['incentivetype.incentivetypename'],
                          employeeAmount: Math.round(totalAmount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          incentiveid: incentive[a].IncentivetypeID,
                        });
                      }

                      incentiveArray = incentiveArray.filter((e) => {
                        return e.incentiveid != incentive[a].IncentivetypeID;
                      });

                      incentiveArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          incentive[a]['incentivetype.incentivetypename'],
                        employeeAmount: Math.round(totalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        incentiveid: incentive[a].IncentivetypeID,
                      });
                    } else {
                      incentiveid.push(incentive[a].IncentivetypeID);

                      if (incentive[a]['incentivetype.consider'] == 'gross') {
                        if (
                          incentive[a]['incentivetype.pfApplicable'] == 'true'
                        ) {
                          pfIncentiveAmount =
                            +pfIncentiveAmount + +incentive[a].amount;
                        }

                        if (
                          incentive[a]['incentivetype.esicApplicable'] == 'true'
                        ) {
                          esicIncentiveAmount =
                            +esicIncentiveAmount + +incentive[a].amount;
                        }

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            incentive[a]['incentivetype.incentivetypename'],
                          employeeAmount: Math.round(incentive[a].amount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          incentiveid: incentive[a].IncentivetypeID,
                        });
                      }

                      incentiveArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          incentive[a]['incentivetype.incentivetypename'],
                        employeeAmount: Math.round(incentive[a].amount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        incentiveid: incentive[a].IncentivetypeID,
                      });
                    }
                  }

                  let finalamount = amountarray.reduce((acc, obj) => {
                    return acc + obj;
                  }, 0);

                  finalinsentivearray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalamount),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                    incentiveid: null,
                  });
                } else {
                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                }
              } else if (salarystructure[j].payheadMasterId == 34) {
                // Penalty

                let penaltyid = [];
                let amountarray = [];

                if (penaltydata.length > 0) {
                  for (var b = 0; b < penaltydata.length; b++) {
                    amountarray.push(+penaltydata[b].amount);

                    let find_id = penaltyid.filter((e) => {
                      return e == penaltydata[b].penaltyID;
                    });

                    if (find_id.length > 0) {
                      let p_Array = userSalaryArray.filter((e) => {
                        return e.penaltyid == penaltydata[b].penaltyID;
                      });

                      userSalaryArray = userSalaryArray.filter((e) => {
                        return e.penaltyid != penaltydata[b].penaltyID;
                      });

                      let totalAmount =
                        Number(p_Array[0].employeeAmount) +
                        Number(penaltydata[b].amount);

                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: penaltydata[b].penaltyName,
                        employeeAmount: Math.round(totalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        penaltyid: penaltydata[b].penaltyID,
                      });
                    } else {
                      penaltyid.push(penaltydata[b].penaltyID);

                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: penaltydata[b].penaltyName,
                        employeeAmount: Math.round(penaltydata[b].amount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        penaltyid: penaltydata[b].penaltyID,
                      });
                    }
                  }

                  let finalamount = amountarray.reduce((acc, obj) => {
                    return acc + obj;
                  }, 0);

                  finalpenaltyarray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalamount),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                    penaltyid: null,
                  });
                } else {
                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                }
              } else if (salarystructure[j].payheadMasterId == 9) {
                // TDS

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: 0,
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 43) {
                // Overtime

                if (
                  salarystructure[j].salaryFieldShow == 'Y' &&
                  overtime &&
                  userAttendacepolicy
                ) {
                  let showinsalaryslip = userAttendacepolicy.showinsalaryslip;

                  let consider = userAttendacepolicy.consider;

                  if (showinsalaryslip == 'true') {
                    overtime_min = +overtime.overtimehrs;
                    if (consider == 'gross') {
                      overtimeAmount = Number(overtime.TotalAmount);
                      toShowOT = userAttendacepolicy.toShowOT;
                      overtimeAmount = Number(overtime.TotalAmount);

                      //For ESIC
                      if (esicApplicable == 'true') {
                        OtherEmployee_ESIC_Amount +=
                          (+overtimeAmount *
                            +userAttendacepolicy.employeeESICPer) /
                          100;
                        OtherEmployer_ESIC_Amount +=
                          (+overtimeAmount *
                            +userAttendacepolicy.employerESICPer) /
                          100;
                        ESIC_CalculatedOn_Amount += +overtimeAmount;
                      }

                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: Number(overtime.TotalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                      });
                    } else {
                      overtimeArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: Number(overtime.TotalAmount),
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                      });
                    }
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: 0,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                    });
                  }
                } else {
                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                }
              } else if (salarystructure[j].payheadMasterId == 15) {
              } else if (salarystructure[j].payheadMasterId == 13) {
              } else if (salarystructure[j].payheadMasterId == 14) {
              } else if (salarystructure[j].payheadMasterId == 78) {
                // penalty data

                finalsalary = penaltyDeductionCalculation(
                  LCEGPenaltyData,
                  attendanceTransData,
                  salary_CalculationDays,
                  gross,
                  salaryStructureBaseoncal,
                  salary_calculation_wise
                );

                finalsalary += PenaltyInSalary;

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                });
              } else if (salarystructure[j].payheadMasterId == 96) {
                // Deposit to deduction from salary
                finalsalary = depositToDeduction.reduce(
                  (acc, obj) => acc + +obj.amount,
                  0
                );

                const result = Object.values(
                  depositToDeduction.reduce((acc, curr) => {
                    if (!acc[curr.depositcategory.depositcategoryname]) {
                      acc[curr.depositcategory.depositcategoryname] = {
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: curr.depositcategory.depositcategoryname,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange: null,
                      };
                    }
                    acc[
                      curr.depositcategory.depositcategoryname
                    ].employeeAmount += curr.amount; // Sum the amount
                    return acc;
                  }, {})
                );

                userSalaryArray = [...userSalaryArray, ...result];

                depositToDeductionArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: null,
                });

                // userSalaryArray.push({
                //   salaryMasterID: salarystructure[j].salaryMasterID,
                //   payheadmasterid: salarystructure[j].payheadMasterId,
                //   payheadName:
                //     salarystructure[j].payheadDisplayName &&
                //       salarystructure[j].payheadDisplayName.trim()
                //       ? salarystructure[j].payheadDisplayName.trim()
                //       : salarystructure[j].payheadName,
                //   employeeAmount: Math.round(finalsalary),
                //   salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                //   salaryfieldside: salarystructure[j].salaryFieldSide,
                //   salaryfieldshow: salarystructure[j].salaryFieldShow,
                //   calculatedOn: null,
                //   salaryfieldmaxrange: null,
                // });
              } else if (salarystructure[j].payheadMasterId == 97) {
                // Deposit to pay in salary
                finalsalary = depositToPay.reduce(
                  (acc, obj) => acc + +obj.amount,
                  0
                );

                const result = Object.values(
                  depositToPay.reduce((acc, curr) => {
                    if (!acc[curr.depositcategory.depositcategoryname]) {
                      acc[curr.depositcategory.depositcategoryname] = {
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName: curr.depositcategory.depositcategoryname,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange: null,
                      };
                    }
                    acc[
                      curr.depositcategory.depositcategoryname
                    ].employeeAmount += curr.amount; // Sum the amount
                    return acc;
                  }, {})
                );

                userSalaryArray = [...userSalaryArray, ...result];

                depositToPayArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(finalsalary),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: null,
                });
              } else if (salarystructure[j].payheadMasterId == 67) {
                // Leave Encashment

                const { amount, encashIds } = calculateLeaveEncashment(
                  allEmployeeLeavePolicy,
                  AllHrleaveTypes,
                  employeeLeaveEncashment,
                  AllsalarystructureData,
                  salary_calculation_wise,
                  salary_CalculationDays
                );

                // set encashids
                finalEncashIds = encashIds;

                userSalaryArray.push({
                  salaryMasterID: salarystructure[j].salaryMasterID,
                  payheadmasterid: salarystructure[j].payheadMasterId,
                  payheadName:
                    salarystructure[j].payheadDisplayName &&
                    salarystructure[j].payheadDisplayName.trim()
                      ? salarystructure[j].payheadDisplayName.trim()
                      : salarystructure[j].payheadName,
                  employeeAmount: Math.round(amount),
                  salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                  salaryfieldside: salarystructure[j].salaryFieldSide,
                  salaryfieldshow: salarystructure[j].salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: null,
                });
              } else if (salarystructure[j].payheadMasterId == 101) {
                BonusPayData = salarystructure[j];
              } else {
                // check depends on att

                if (salarystructure[j].salaryFieldAttanChk == 0) {
                  finalsalary = +salarystructure[j].ActualEmployeeSalaryAmount;
                } else if (salarystructure[j].salaryFieldAttanChk == 2) {
                  // if physical Attndance

                  finalsalary =
                    Math.round(+salarystructure[j].ActualEmployeeSalaryAmount) *
                    +attendanceTransData.length;
                } else {
                  if (salary_calculation_wise == 'hourwise') {
                    let oneminutesalry =
                      Number(salarystructure[j].ActualEmployeeSalaryAmount) /
                      Number(dailyworkingminutes);

                    finalsalary =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                  } else {
                    finalsalary =
                      Number(salarystructure[j].ActualEmployeeSalaryAmount) *
                      Number(usertotalpresentday);
                  }
                }
                if (salarystructure[j].salaryFieldRound == 'Y') {
                  finalsalary =
                    salarystructure[j].roundOffType == 0
                      ? Math.ceil(finalsalary.toFixed(2))
                      : Math.round(finalsalary);
                } else {
                  let salaryfieldroundno = Number(
                    !salarystructure[j].salaryFieldRoundNo
                      ? 0
                      : salarystructure[j].salaryFieldRoundNo
                  );
                  finalsalary = Number(finalsalary.toFixed(salaryfieldroundno));
                }

                if (
                  salarystructure[j].payheadMasterId == 4 ||
                  salarystructure[j].payheadMasterId == 5 ||
                  salarystructure[j].payheadMasterId == 12 ||
                  salarystructure[j].payheadMasterId == 25 ||
                  salarystructure[j].payheadMasterId == 66
                ) {
                  let pf = 0;

                  if ([4, 12].includes(salarystructure[j].payheadMasterId)) {
                    pf =
                      (Number(salarystructure[j].ActualEmployeeSalaryAmount) *
                        100) /
                      (salarystructure[j].payheadMasterId == 4 ? 12 : 8.33);
                  }

                  let calculatedOn = 0;

                  if (salary_calculation_wise == 'hourwise') {
                    calculatedOn =
                      (Number(pf) / Number(dailyworkingminutes)) *
                      Number(usertotalpresentday);
                  } else {
                    calculatedOn = Number(pf) * Number(usertotalpresentday);
                  }

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: finalsalary,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: [4, 12].includes(
                      salarystructure[j].payheadMasterId
                    )
                      ? +calculatedOn
                      : null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                    salaryFieldRound: salarystructure[j].salaryFieldRound,
                    salaryFieldRoundNo: salarystructure[j].salaryFieldRoundNo,
                    roundOffType: salarystructure[j].roundOffType,
                    considerIn: salarystructure[j].considerIn,
                  });
                } else {
                  if (salarystructure[j].salaryFieldRound == 'Y') {
                    finalsalary =
                      salarystructure[j].roundOffType == 0
                        ? Math.ceil(finalsalary.toFixed(2))
                        : Math.round(finalsalary);
                  } else {
                    let salaryfieldroundno = Number(
                      !salarystructure[j].salaryFieldRoundNo
                        ? 0
                        : salarystructure[j].salaryFieldRoundNo
                    );
                    finalsalary = Number(
                      finalsalary.toFixed(salaryfieldroundno)
                    );
                  }

                  if (salarystructure[j].salaryFieldWhenMonth[0] != 0) {
                    let currentmonth = Month;

                    if (Number(currentmonth) < 10) {
                      currentmonth = Month.slice(1);
                    }

                    let whencalculation =
                      salarystructure[j].salaryFieldWhenMonth;
                    whencalculation = whencalculation.filter((s) => {
                      return s == currentmonth;
                    });

                    if (whencalculation.length > 0) {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: finalsalary,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        considerIn: salarystructure[j].considerIn,
                      });
                    } else {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        considerIn: salarystructure[j].considerIn,
                      });
                    }
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: finalsalary,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                      considerIn: salarystructure[j].considerIn,
                    });
                  }
                }
              }
            }

            // ----------------------Bonus Pay Calculation ---------------------------------------
            if (BonusPayData) {
              const currentBonusAmount =
                userSalaryArray.find((e) => e.payheadmasterid == 6)
                  ?.employeeAmount || 0;

              const { amount, ids, addcurrentId } = await getPayBonusAmount(
                bonusPolicy,
                yearmonth,
                currentBonusAmount,
                usermaster[i].userMasterID
              );

              BonusIds = ids;
              addCurrentBonusId = addcurrentId;

              userSalaryArray.push({
                salaryMasterID: BonusPayData.salaryMasterID,
                payheadmasterid: BonusPayData.payheadMasterId,
                payheadName:
                  BonusPayData.payheadDisplayName &&
                  BonusPayData.payheadDisplayName.trim()
                    ? BonusPayData.payheadDisplayName.trim()
                    : BonusPayData.payheadName,
                employeeAmount: Math.round(+amount),
                salaryfieldsrno: BonusPayData.salaryFieldSrNo,
                salaryfieldside: BonusPayData.salaryFieldSide,
                salaryfieldshow: BonusPayData.salaryFieldShow,
                calculatedOn: null,
                salaryfieldmaxrange: BonusPayData.salaryfieldmaxrange,
                considerIn: BonusPayData.considerIn,
              });
            }

            //----------------- Push LWP Deduction in salary array------

            if (lwp_deduction) {
              userSalaryArray.push({
                salaryMasterID: lwp_deduction.salaryMasterID,
                payheadmasterid: lwp_deduction.payheadMasterId,
                payheadName:
                  lwp_deduction.payheadDisplayName &&
                  lwp_deduction.payheadDisplayName.trim()
                    ? lwp_deduction.payheadDisplayName.trim()
                    : lwp_deduction.payheadName,
                employeeAmount: 0,
                salaryfieldsrno: lwp_deduction.salaryFieldSrNo,
                salaryfieldside: lwp_deduction.salaryFieldSide,
                salaryfieldshow: lwp_deduction.salaryFieldShow,
                calculatedOn: null,
                salaryfieldmaxrange: lwp_deduction.salaryfieldmaxrange,
                considerIn: lwp_deduction.considerIn,
              });
            }

            // deduct pf on overtime

            if (pfApplicable == 'true' || +pfIncentiveAmount > 0) {
              let pfDeductionAmount = 0;
              if (pfApplicable != 'true') {
                pfDeductionAmount = +pfIncentiveAmount;
              } else {
                pfDeductionAmount = +overtimeAmount + +pfIncentiveAmount;
              }

              userSalaryArray.forEach((e) => {
                if (
                  e.payheadmasterid == 4 ||
                  e.payheadmasterid == 5 ||
                  e.payheadmasterid == 12 ||
                  e.payheadmasterid == 25 ||
                  e.payheadmasterid == 66
                ) {
                  const amount =
                    Number(e.employeeAmount) +
                    (e.payheadmasterid == 4
                      ? (Number(pfDeductionAmount) * 12) / 100
                      : e.payheadmasterid == 5
                        ? (Number(pfDeductionAmount) * 3.67) / 100
                        : e.payheadmasterid == 12
                          ? (Number(pfDeductionAmount) * 8.33) / 100
                          : (Number(pfDeductionAmount) * 0.5) / 100);

                  e.employeeAmount =
                    e.salaryFieldRound == 'Y'
                      ? e.roundOffType == 0
                        ? Math.ceil(amount.toFixed(2))
                        : Math.round(amount)
                      : !e.salaryFieldRound
                        ? Math.round(amount)
                        : amount.toFixed(+e.salaryFieldRoundNo);

                  if ([4, 12].includes(e.payheadmasterid))
                    e.calculatedOn = Math.round(
                      Number(e.calculatedOn) + Number(pfDeductionAmount)
                    );
                }
              });
            } else {
              userSalaryArray.forEach((e) => {
                if (
                  e.payheadmasterid == 4 ||
                  e.payheadmasterid == 5 ||
                  e.payheadmasterid == 12 ||
                  e.payheadmasterid == 25 ||
                  e.payheadmasterid == 66
                ) {
                  // const amount = Number(e.employeeAmount);

                  e.employeeAmount =
                    e.salaryFieldRound == 'Y'
                      ? e.roundOffType == 0
                        ? Math.ceil((+e.employeeAmount).toFixed(2))
                        : Math.round(+e.employeeAmount)
                      : !e.salaryFieldRound
                        ? Math.round(+e.employeeAmount)
                        : (+e.employeeAmount).toFixed(+e.salaryFieldRoundNo);

                  if ([4, 12].includes(e.payheadmasterid))
                    e.calculatedOn = Math.round(Number(e.calculatedOn));
                }
              });
            }

            let ot_payheadMasterId,
              toAddOTInOtherPathead = false;

            // if attendancepolicy has show ot as add in payhead

            if (
              userAttendacepolicy &&
              userAttendacepolicy.toShowOT == 'addInPayhead'
            ) {
              ot_payheadMasterId = userAttendacepolicy.payheadMasterId;
              // Check if payhead id is  present or not in structure
              toAddOTInOtherPathead = userSalaryArray.find(
                (e) => +e.payheadmasterid == +ot_payheadMasterId
              )
                ? true
                : false;
              // If present then add Amount
              if (toAddOTInOtherPathead) {
                userSalaryArray = userSalaryArray.map((e) => {
                  if (+e.payheadmasterid == +ot_payheadMasterId)
                    e.employeeAmount += +overtimeAmount;
                  if (+e.payheadmasterid == 43) e.employeeAmount = 0;
                  return e;
                });
                // Set OT Array Empty
                overtimeArray = [];
              }
            }

            // set max range

            userSalaryArray.map((e) => {
              if (e.salaryfieldmaxrange) {
                if (+e.salaryfieldmaxrange < +e.employeeAmount) {
                  // pf
                  if (e.payheadmasterid == 4) {
                    e.calculatedOn = Math.round(
                      (+e.salaryfieldmaxrange * 100) / 12
                    );
                  }
                  // EPS
                  if (e.payheadmasterid == 12) {
                    e.calculatedOn =
                      +e.salaryfieldmaxrange == 1250
                        ? 15000
                        : Math.round((+e.salaryfieldmaxrange * 100) / 8.33);
                  }
                  e.employeeAmount = +e.salaryfieldmaxrange;
                }
              }
            });

            // ----------------------------- calculate EPF Amount  ---------------------------

            if (EPF_Data) {
              const PF_amount =
                userSalaryArray.find((e) => e.payheadmasterid == 4)
                  ?.employeeAmount || 0;
              const EPS_amount =
                userSalaryArray.find((e) => e.payheadmasterid == 12)
                  ?.employeeAmount || 0;

              const amount1 =
                +PF_amount - +EPS_amount > 0 ? +PF_amount - +EPS_amount : 0;

              const employeeAmount =
                EPF_Data.salaryFieldRound == 'Y'
                  ? EPF_Data.roundOffType == 0
                    ? Math.ceil((+amount1).toFixed(2))
                    : Math.round(+amount1)
                  : !EPF_Data.salaryFieldRound
                    ? Math.round(+amount1)
                    : (+amount1).toFixed(+EPF_Data.salaryFieldRoundNo);

              userSalaryArray.push({
                salaryMasterID: EPF_Data.salaryMasterID,
                payheadmasterid: EPF_Data.payheadMasterId,
                payheadName:
                  EPF_Data.payheadDisplayName &&
                  EPF_Data.payheadDisplayName.trim()
                    ? EPF_Data.payheadDisplayName.trim()
                    : EPF_Data.payheadName,
                employeeAmount,
                salaryfieldsrno: EPF_Data.salaryFieldSrNo,
                salaryfieldside: EPF_Data.salaryFieldSide,
                salaryfieldshow: EPF_Data.salaryFieldShow,
                calculatedOn: null,
                salaryfieldmaxrange: EPF_Data.salaryfieldmaxrange,
                considerIn: EPF_Data.considerIn,
              });
            }

            employee_gross = userSalaryArray
              .filter(
                (e) =>
                  e.salaryfieldsrno == 'A' &&
                  e.salaryfieldshow == 'Y' &&
                  e.considerIn != 'net'
              )
              .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

            let employee_otherAmount = 0;

            userSalaryArray.filter((s) => {
              if (
                s.salaryfieldside == 'D' &&
                s.salaryfieldsrno != 'C' &&
                s.employeeAmount != 0 &&
                s.salaryfieldshow == 'Y'
              ) {
                employee_otherAmount = employee_otherAmount + +s.employeeAmount;
              }
            });

            // add amount in net pay
            employee_extraAddInNetPay = userSalaryArray
              .filter(
                (e) =>
                  e.salaryfieldsrno == 'A' &&
                  e.salaryfieldshow == 'Y' &&
                  e.considerIn == 'net'
              )
              .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

            employee_netPay =
              Number(employee_gross) -
              Number(employee_otherAmount) +
              +employee_extraAddInNetPay;

            // employee PT
            const ptdata = salarystructure.filter((s) => {
              return s.payheadMasterId == 15;
            });

            if (ptdata.length > 0) {
              let get_one_data1 = await ProfessionalTaxSlabMaster.findOne({
                where: {
                  stateMasterID: +ptdata[0].stateid,
                  fromAmount: { [Sequelize.Op.lte]: +employee_gross },
                  toAmount: { [Sequelize.Op.gte]: +employee_gross },
                  status: 1,
                  month: +Month,
                  applicableFromYYYYMM: {
                    [Sequelize.Op.lte]: String(yearmonth),
                  },
                },
                order: [['applicableFromYYYYMM', 'DESC']],
              });

              let value;
              if (get_one_data1) {
                if (usermaster[i].gender == 'female') {
                  value = get_one_data1.femaleTax;
                } else {
                  value = get_one_data1.maleTax;
                }
              } else {
                value = 0;
              }

              userSalaryArray.push({
                salaryMasterID: ptdata[0].salaryMasterID,
                payheadmasterid: ptdata[0].payheadMasterId,
                payheadName:
                  ptdata[0].payheadDisplayName &&
                  ptdata[0].payheadDisplayName.trim()
                    ? ptdata[0].payheadDisplayName.trim()
                    : ptdata[0].payheadName,
                employeeAmount: +value,
                salaryfieldsrno: ptdata[0].salaryFieldSrNo,
                salaryfieldside: ptdata[0].salaryFieldSide,
                salaryfieldshow: ptdata[0].salaryFieldShow,
                calculatedOn: null,
              });

              employee_netPay = Number(employee_netPay) - Number(value);
            }

            // employee esic

            const esicdata = salarystructure.filter((s) => {
              return s.payheadMasterId == 13;
            });

            if (esicdata.length > 0) {
              if (Number(esicdata[0].EmployeeSalaryAmount) > 0) {
                let value = 0,
                  calculatedOn = 0;

                if (esicDeduction == true) {
                  const esic =
                    (Number(esicdata[0].ActualEmployeeSalaryAmount) * 100) /
                    0.75;

                  if (salary_calculation_wise == 'hourwise') {
                    let oneminutesalry =
                      Number(esicdata[0].ActualEmployeeSalaryAmount) /
                      Number(dailyworkingminutes);

                    value =
                      Number(oneminutesalry) * Number(usertotalpresentday);

                    calculatedOn =
                      (Number(esic) / Number(dailyworkingminutes)) *
                      Number(usertotalpresentday);
                  } else {
                    let onedaysalary = Number(
                      esicdata[0].ActualEmployeeSalaryAmount
                    );

                    value = Number(onedaysalary) * Number(usertotalpresentday);
                    calculatedOn = Number(esic) * Number(usertotalpresentday);
                  }

                  value += +OtherEmployee_ESIC_Amount;
                  calculatedOn += +ESIC_CalculatedOn_Amount;

                  // check max range

                  if (esicdata[0].salaryfieldmaxrange) {
                    if (+value > +esicdata[0].salaryfieldmaxrange) {
                      value = +esicdata[0].salaryfieldmaxrange;
                    }
                  }

                  value =
                    esicdata[0].salaryFieldRound == 'Y'
                      ? esicdata[0].roundOffType == 0
                        ? Math.ceil(value.toFixed(2))
                        : Math.round(value)
                      : !esicdata[0].salaryFieldRound
                        ? Math.round(value)
                        : value.toFixed(+esicdata[0].salaryFieldRoundNo);
                }

                userSalaryArray.push({
                  salaryMasterID: esicdata[0].salaryMasterID,
                  payheadmasterid: esicdata[0].payheadMasterId,
                  payheadName:
                    esicdata[0].payheadDisplayName &&
                    esicdata[0].payheadDisplayName.trim()
                      ? esicdata[0].payheadDisplayName.trim()
                      : esicdata[0].payheadName,
                  employeeAmount: +value,
                  salaryfieldsrno: esicdata[0].salaryFieldSrNo,
                  salaryfieldside: esicdata[0].salaryFieldSide,
                  salaryfieldshow: esicdata[0].salaryFieldShow,
                  calculatedOn:
                    +calculatedOn > 0 ? Math.round(+calculatedOn) : null,
                });

                employee_netPay = Number(employee_netPay) - Number(value);
              }
            }

            // company esic

            const co_esicdata = salarystructure.filter((s) => {
              return s.payheadMasterId == 14;
            });

            if (co_esicdata.length > 0) {
              if (Number(co_esicdata[0].EmployeeSalaryAmount) > 0) {
                let value = 0;

                if (esicDeduction == true) {
                  if (salary_calculation_wise == 'hourwise') {
                    let oneminutesalry =
                      Number(co_esicdata[0].EmployeeSalaryAmount) /
                      Number(dailyworkingminutes);

                    value =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                  } else {
                    let onedaysalary = Number(
                      co_esicdata[0].ActualEmployeeSalaryAmount
                    );

                    value = Number(onedaysalary) * Number(usertotalpresentday);
                  }

                  //SUM Of ESIC
                  value += +OtherEmployer_ESIC_Amount;

                  // max range

                  if (co_esicdata[0].salaryfieldmaxrange) {
                    if (+value > +co_esicdata[0].salaryfieldmaxrange) {
                      value = +co_esicdata[0].salaryfieldmaxrange;
                    }
                  }

                  value =
                    co_esicdata[0].salaryFieldRound == 'Y'
                      ? co_esicdata[0].roundOffType == 0
                        ? Math.ceil(value.toFixed(2))
                        : Math.round(value)
                      : !co_esicdata[0].salaryFieldRoundNo
                        ? Math.round(value)
                        : value.toFixed(+co_esicdata[0].salaryFieldRoundNo);
                }

                userSalaryArray.push({
                  salaryMasterID: co_esicdata[0].salaryMasterID,
                  payheadmasterid: co_esicdata[0].payheadMasterId,
                  payheadName:
                    co_esicdata[0].payheadDisplayName &&
                    co_esicdata[0].payheadDisplayName.trim()
                      ? co_esicdata[0].payheadDisplayName.trim()
                      : co_esicdata[0].payheadName,
                  employeeAmount: +value,
                  salaryfieldsrno: co_esicdata[0].salaryFieldSrNo,
                  salaryfieldside: co_esicdata[0].salaryFieldSide,
                  salaryfieldshow: co_esicdata[0].salaryFieldShow,
                  calculatedOn: null,
                });
              }
            }

            // push incentive
            if (incentiveArray.length > 0) {
              userSalaryArray = userSalaryArray.filter((s) => {
                return s.payheadmasterid != 24;
              });

              userSalaryArray = [...userSalaryArray, ...incentiveArray];
            }

            // push overtime

            if (overtimeArray.length > 0) {
              userSalaryArray = userSalaryArray.filter((s) => {
                return s.payheadmasterid != 43;
              });

              userSalaryArray = [...userSalaryArray, ...overtimeArray];
            }

            let employeefinalsalary = userSalaryArray;

            const EmployerSideDeduction = userSalaryArray
              .filter((s) => s.salaryfieldsrno == 'C')
              .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

            userSalaryArray = userSalaryArray.filter((s) => {
              return s.salaryfieldsrno != 'C' && s.salaryfieldshow == 'Y';
            });

            // show data

            for (let g = 0; g < userSalaryArray.length; g++) {
              if (
                [
                  16, 17, 24, 34, 9, 43, 14, 13, 15, 78, 83, 99, 67, 101,
                ].includes(userSalaryArray[g].payheadmasterid)
              ) {
                if (userSalaryArray[g].employeeAmount != 0) {
                  showusersalary.push(userSalaryArray[g]);
                }
              } else {
                showusersalary.push(userSalaryArray[g]);
              }
            }

            let totalear = 0;
            let totaldedu = 0;
            // for final net pay

            showusersalary.filter((e) => {
              if (e.salaryfieldside == 'E') {
                totalear = totalear + +e.employeeAmount;
              }
            });

            showusersalary.filter((e) => {
              if (e.salaryfieldside == 'D') {
                totaldedu = totaldedu + +e.employeeAmount;
              }
            });

            employee_netPay = Number(totalear) - Number(totaldedu);

            // To check decimal or not

            if (
              +employee_netPay % 1 !== 0 &&
              CTC_GROSS_NET.find((e) => e.payheadMasterId == 92)
                ?.salaryFieldRound == 'N'
            ) {
              employee_netPay = +employee_netPay.toFixed(
                +CTC_GROSS_NET.find((e) => e.payheadMasterId == 92)
                  ?.salaryFieldRoundNo || 0
              );
            } else {
              employee_netPay = Math.round(+employee_netPay);
            }

            if (
              +employee_gross % 1 !== 0 &&
              CTC_GROSS_NET.find((e) => e.payheadMasterId == 50)
                ?.salaryFieldRound == 'N'
            ) {
              employee_gross = +employee_gross.toFixed(
                +CTC_GROSS_NET.find((e) => e.payheadMasterId == 50)
                  ?.salaryFieldRoundNo || 0
              );
            } else {
              employee_gross = Math.round(+employee_gross);
            }

            let employee_ctc =
              +employee_gross +
              +employee_extraAddInNetPay +
              +EmployerSideDeduction;

            if (
              +employee_ctc % 1 !== 0 &&
              CTC_GROSS_NET.find((e) => e.payheadMasterId == 1)
                ?.salaryFieldRound == 'N'
            ) {
              employee_ctc = +employee_ctc.toFixed(
                +CTC_GROSS_NET.find((e) => e.payheadMasterId == 1)
                  ?.salaryFieldRoundNo || 0
              );
            } else {
              employee_ctc = Math.round(+employee_ctc);
            }

            //--------------------- Add CTC GROSS NET SALARY in salary Data ------------------------------

            CTC_GROSS_NET.forEach((e) => {
              if ([50, 92, 1].includes(e.payheadMasterId)) {
                employeefinalsalary.push({
                  salaryMasterID: e.salaryMasterID,
                  payheadmasterid: e.payheadMasterId,
                  payheadName:
                    e.payheadDisplayName && e.payheadDisplayName.trim()
                      ? e.payheadDisplayName.trim()
                      : e.payheadName,
                  employeeAmount:
                    e.payheadMasterId == 50
                      ? +employee_gross
                      : e.payheadMasterId == 92
                        ? +employee_netPay
                        : +employee_ctc,
                  salaryfieldsrno: e.salaryFieldSrNo,
                  salaryfieldside: e.salaryFieldSide,
                  salaryfieldshow: e.salaryFieldShow,
                  calculatedOn: null,
                });
              }
            });

            // combined incentive

            if (finalinsentivearray.length > 0) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 24;
              });

              employeefinalsalary.push(finalinsentivearray[0]);
            }

            // combined penalty

            if (finalpenaltyarray.length > 0) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 34;
              });

              employeefinalsalary.push(finalpenaltyarray[0]);
            }

            // Final Deposit of deduction
            if (depositToDeductionArray.length) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 96;
              });

              employeefinalsalary.push(depositToDeductionArray[0]);
            }

            // Final Deposit of Pay
            if (depositToPayArray.length) {
              employeefinalsalary = employeefinalsalary.filter((e) => {
                return e.payheadmasterid != 97;
              });

              employeefinalsalary.push(depositToPayArray[0]);
            }

            const advanceIds =
              advanceData.length > 0
                ? advanceData.map((e) => e.advancePaymentID)
                : [];
            const loantranIds =
              loanData.length > 0
                ? loanData.map((e) => e.LoanTrasactionId)
                : [];
            const penaltyIds =
              penaltydata.length > 0
                ? penaltydata.map((e) => e.employeePenaltyID)
                : [];
            const incentiveIds =
              incentiveData.length > 0
                ? incentiveData.map((e) => e.employeeincentiveID)
                : [];

            let currentBonusData = null;

            // add salary

            for (let l = 0; l < employeefinalsalary.length; l++) {
              let add_data = await HrSalaryTrans.create(
                {
                  userMasterID: usermaster[i].userMasterID,
                  salaryMasterID: employeefinalsalary[l].salaryMasterID,
                  salaryYYYYMM: yearmonth,
                  EmployeeSalaryPer: 0,
                  EmployeeSalaryAmount: employeefinalsalary[l].employeeAmount,
                  SalaryCalcOnDays: usertotalpresentday,
                  createBy: createBy,
                  createByIp: createByIp,
                  calculatedOn: employeefinalsalary[l].calculatedOn,
                },
                { transaction: t }
              );

              // Bonus
              if (
                employeefinalsalary[l].payheadmasterid == 6 &&
                +employeefinalsalary[l].employeeAmount > 0
              ) {
                currentBonusData = await EmployeeBonus.create(
                  {
                    userMasterID: usermaster[i].userMasterID,
                    amount: Math.round(+employeefinalsalary[l].employeeAmount),
                    bonusYYYYMM: yearmonth,
                    referenceId: add_data.userSalaryTranID,
                  },
                  {
                    user: req.userDetails,
                    transaction: t,
                  }
                );
              }

              // Pay Bonus

              if (
                employeefinalsalary[l].payheadmasterid == 101 &&
                BonusPayData &&
                (BonusIds.length || addCurrentBonusId)
              ) {
                await EmployeeBonus.update(
                  {
                    payReferenceId: add_data.userSalaryTranID,
                    payYYYYMM: yearmonth,
                  },
                  {
                    where: {
                      id: {
                        [Sequelize.Op.in]: BonusIds,
                      },
                    },
                    individualHooks: true,
                    user: req.userDetails,
                    transaction: t,
                  }
                );

                if (addCurrentBonusId && currentBonusData) {
                  await currentBonusData.update(
                    {
                      payReferenceId: add_data.userSalaryTranID,
                      payYYYYMM: yearmonth,
                    },
                    {
                      user: req.userDetails,
                      transaction: t,
                    }
                  );
                }
              }

              //  update Advance
              if (
                employeefinalsalary[l].payheadmasterid == 16 &&
                advanceIds.length > 0
              ) {
                await advancePayments.update(
                  {
                    tablereferenceID: add_data.userSalaryTranID,
                    tableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      advancePaymentID: advanceIds,
                    },
                    transaction: t,
                  }
                );
              }

              // update Loan
              if (
                employeefinalsalary[l].payheadmasterid == 17 &&
                loantranIds.length > 0
              ) {
                await LoanTransactions.update(
                  {
                    RefrenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      LoanTrasactionId: loantranIds,
                    },
                    transaction: t,
                  }
                );
              }

              // update Penalty

              if (
                employeefinalsalary[l].payheadmasterid == 34 &&
                penaltyIds.length > 0
              ) {
                await employeePenalties.update(
                  {
                    RefrenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      employeePenaltyID: penaltyIds,
                    },
                    transaction: t,
                  }
                );
              }

              // update incentive

              if (
                employeefinalsalary[l].payheadmasterid == 24 &&
                incentiveIds.length > 0
              ) {
                await Employeeincentive.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      employeeincentiveID: incentiveIds,
                    },
                    transaction: t,
                  }
                );
              }
              // update overtimecal

              if (
                employeefinalsalary[l].payheadmasterid == 43 &&
                +employeefinalsalary[l].employeeAmount > 0
              ) {
                await OverTimeCalculationMains.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    tableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      userMasterID: usermaster[i].userMasterID,
                      yyyymm: yearmonth,
                    },
                    transaction: t,
                  }
                );
              }

              // update deposits

              if (
                depositToDeduction.length &&
                employeefinalsalary[l].payheadmasterid == 96
              ) {
                await deposit.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      depositId: depositToDeduction.map((e) => e.depositId),
                    },
                    transaction: t,
                  }
                );
              }

              // update deposits

              if (
                depositToPay.length &&
                employeefinalsalary[l].payheadmasterid == 97
              ) {
                await deposit.update(
                  {
                    ReferenceId: add_data.userSalaryTranID,
                    TableName: 'hrSalaryTrasactions',
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      depositId: depositToPay.map((e) => e.depositId),
                    },
                    transaction: t,
                  }
                );
              }

              // update leaveEncashment

              if (
                finalEncashIds.length &&
                employeefinalsalary[l].payheadmasterid == 67
              ) {
                await LeaveEncashment.update(
                  {
                    referenceId: add_data.userSalaryTranID,
                    updateBy: createBy,
                    updateByIp: createByIp,
                  },
                  {
                    where: {
                      id: {
                        [Sequelize.Op.in]: finalEncashIds,
                      },
                    },
                    transaction: t,
                  }
                );
              }
            }
          }

          // Hour wise salary calculation
          else if (salarystructure[0].baseOnCalculation == 'H') {
            let incentiveArray = [];
            let finalinsentivearray = [];
            let finalpenaltyarray = [];
            let overtimeArray = [];
            let overtimeAmount = 0;
            let pfIncentiveAmount = 0;
            let esicIncentiveAmount = 0;
            let toShowOT = '',
              OtherEmployee_ESIC_Amount = 0,
              OtherEmployer_ESIC_Amount = 0,
              ESIC_CalculatedOn_Amount = 0;

            if (salary_calculation_wise == 'hourwise') {
              for (let j = 0; j < salarystructure.length; j++) {
                let finalsalary = 0;

                if (salarystructure[j].payheadMasterId == 16) {
                  //Advance

                  finalsalary = advanceData.reduce((acc, item) => {
                    const childSum = (item.employeeRepayments || []).reduce(
                      (sum, child) => sum + +child.amount,
                      0
                    );
                    return acc + (+item.amount - +childSum);
                  }, 0);

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount:
                      finalsalary > 0 ? Math.round(finalsalary) : 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                } else if (salarystructure[j].payheadMasterId == 17) {
                  //Loan

                  finalsalary = loanData.reduce(
                    (acc, obj) => acc + +obj.EMIAmount,
                    0
                  );

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalsalary),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                } else if (salarystructure[j].payheadMasterId == 24) {
                  // Incentive

                  let incentive = incentiveData;

                  let incentiveid = [];
                  let amountarray = [];
                  if (incentive.length > 0) {
                    for (let a = 0; a < incentive.length; a++) {
                      amountarray.push(+incentive[a].amount);

                      // FOR ESIC
                      if (
                        incentive[a]['incentivetype.esicApplicable'] == 'true'
                      ) {
                        OtherEmployee_ESIC_Amount +=
                          (+incentive[a].amount *
                            +incentive[a]['incentivetype.employeeESICPer']) /
                          100;
                        OtherEmployer_ESIC_Amount +=
                          (+incentive[a].amount *
                            +incentive[a]['incentivetype.employerESICPer']) /
                          100;
                        ESIC_CalculatedOn_Amount += +incentive[a].amount;
                      }

                      let find_id = incentiveid.filter((e) => {
                        return e == incentive[a].IncentivetypeID;
                      });

                      if (find_id.length > 0) {
                        let p_Array = incentiveArray.filter((e) => {
                          return e.incentiveid == incentive[a].IncentivetypeID;
                        });

                        let totalAmount =
                          Number(p_Array[0].employeeAmount) +
                          Number(incentive[a].amount);

                        if (incentive[a]['incentivetype.consider'] == 'gross') {
                          if (
                            incentive[a]['incentivetype.pfApplicable'] == 'true'
                          ) {
                            pfIncentiveAmount =
                              +pfIncentiveAmount + +incentive[a].amount;
                          }

                          if (
                            incentive[a]['incentivetype.esicApplicable'] ==
                            'true'
                          ) {
                            esicIncentiveAmount =
                              +esicIncentiveAmount + +incentive[a].amount;
                          }

                          userSalaryArray = userSalaryArray.filter((e) => {
                            return (
                              e.incentiveid != incentive[a].IncentivetypeID
                            );
                          });

                          userSalaryArray.push({
                            salaryMasterID: salarystructure[j].salaryMasterID,
                            payheadmasterid: salarystructure[j].payheadMasterId,
                            payheadName:
                              incentive[a]['incentivetype.incentivetypename'],
                            employeeAmount: Math.round(totalAmount),
                            salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                            salaryfieldside: salarystructure[j].salaryFieldSide,
                            salaryfieldshow: salarystructure[j].salaryFieldShow,
                            calculatedOn: null,
                            salaryfieldmaxrange:
                              salarystructure[j].salaryfieldmaxrange,
                            incentiveid: incentive[a].IncentivetypeID,
                          });
                        }

                        incentiveArray = incentiveArray.filter((e) => {
                          return e.incentiveid != incentive[a].IncentivetypeID;
                        });

                        incentiveArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            incentive[a]['incentivetype.incentivetypename'],
                          employeeAmount: Math.round(totalAmount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          incentiveid: incentive[a].IncentivetypeID,
                        });
                      } else {
                        incentiveid.push(incentive[a].IncentivetypeID);

                        if (incentive[a]['incentivetype.consider'] == 'gross') {
                          if (
                            incentive[a]['incentivetype.pfApplicable'] == 'true'
                          ) {
                            pfIncentiveAmount =
                              +pfIncentiveAmount + +incentive[a].amount;
                          }

                          if (
                            incentive[a]['incentivetype.esicApplicable'] ==
                            'true'
                          ) {
                            esicIncentiveAmount =
                              +esicIncentiveAmount + +incentive[a].amount;
                          }

                          userSalaryArray.push({
                            salaryMasterID: salarystructure[j].salaryMasterID,
                            payheadmasterid: salarystructure[j].payheadMasterId,
                            payheadName:
                              incentive[a]['incentivetype.incentivetypename'],
                            employeeAmount: Math.round(incentive[a].amount),
                            salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                            salaryfieldside: salarystructure[j].salaryFieldSide,
                            salaryfieldshow: salarystructure[j].salaryFieldShow,
                            calculatedOn: null,
                            salaryfieldmaxrange:
                              salarystructure[j].salaryfieldmaxrange,
                            incentiveid: incentive[a].IncentivetypeID,
                          });
                        }

                        incentiveArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            incentive[a]['incentivetype.incentivetypename'],
                          employeeAmount: Math.round(incentive[a].amount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          incentiveid: incentive[a].IncentivetypeID,
                        });
                      }
                    }

                    let finalamount = amountarray.reduce((acc, obj) => {
                      return acc + obj;
                    }, 0);

                    finalinsentivearray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: Math.round(finalamount),
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                      incentiveid: null,
                    });
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: 0,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                    });
                  }
                } else if (salarystructure[j].payheadMasterId == 34) {
                  // Penalty

                  let penaltyid = [];
                  let amountarray = [];

                  if (penaltydata.length > 0) {
                    for (var b = 0; b < penaltydata.length; b++) {
                      amountarray.push(+penaltydata[b].amount);

                      let find_id = penaltyid.filter((e) => {
                        return e == penaltydata[b].penaltyID;
                      });

                      if (find_id.length > 0) {
                        let p_Array = userSalaryArray.filter((e) => {
                          return e.penaltyid == penaltydata[b].penaltyID;
                        });

                        userSalaryArray = userSalaryArray.filter((e) => {
                          return e.penaltyid != penaltydata[b].penaltyID;
                        });

                        let totalAmount =
                          Number(p_Array[0].employeeAmount) +
                          Number(penaltydata[b].amount);

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName: penaltydata[b].penaltyName,
                          employeeAmount: Math.round(totalAmount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          penaltyid: penaltydata[b].penaltyID,
                        });
                      } else {
                        penaltyid.push(penaltydata[b].penaltyID);

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName: penaltydata[b].penaltyName,
                          employeeAmount: Math.round(penaltydata[b].amount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          penaltyid: penaltydata[b].penaltyID,
                        });
                      }
                    }

                    let finalamount = amountarray.reduce((acc, obj) => {
                      return acc + obj;
                    }, 0);

                    finalpenaltyarray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: Math.round(finalamount),
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                      penaltyid: null,
                    });
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: 0,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                    });
                  }
                } else if (salarystructure[j].payheadMasterId == 9) {
                  // TDS

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: 0,
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                } else if (salarystructure[j].payheadMasterId == 43) {
                  // Overtime

                  if (
                    salarystructure[j].salaryFieldShow == 'Y' &&
                    overtime &&
                    userAttendacepolicy
                  ) {
                    let showinsalaryslip = userAttendacepolicy.showinsalaryslip;

                    let consider = userAttendacepolicy.consider;

                    if (showinsalaryslip == 'true') {
                      overtime_min = +overtime.overtimehrs;
                      toShowOT = userAttendacepolicy.toShowOT;
                      overtimeAmount = Number(overtime.TotalAmount);

                      //For ESIC
                      if (esicApplicable == 'true') {
                        OtherEmployee_ESIC_Amount +=
                          (+overtimeAmount *
                            +userAttendacepolicy.employeeESICPer) /
                          100;
                        OtherEmployer_ESIC_Amount +=
                          (+overtimeAmount *
                            +userAttendacepolicy.employerESICPer) /
                          100;
                        ESIC_CalculatedOn_Amount += +overtimeAmount;
                      }
                      if (consider == 'gross') {
                        overtimeAmount = Number(overtime.TotalAmount);

                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            salarystructure[j].payheadDisplayName &&
                            salarystructure[j].payheadDisplayName.trim()
                              ? salarystructure[j].payheadDisplayName.trim()
                              : salarystructure[j].payheadName,
                          employeeAmount: Number(overtime.TotalAmount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                        });
                      } else {
                        overtimeArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            salarystructure[j].payheadDisplayName &&
                            salarystructure[j].payheadDisplayName.trim()
                              ? salarystructure[j].payheadDisplayName.trim()
                              : salarystructure[j].payheadName,
                          employeeAmount: Number(overtime.TotalAmount),
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                        });
                      }
                    } else {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: 0,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                      });
                    }
                  } else {
                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: 0,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                    });
                  }
                } else if (salarystructure[j].payheadMasterId == 15) {
                } else if (salarystructure[j].payheadMasterId == 13) {
                } else if (salarystructure[j].payheadMasterId == 14) {
                } else if (salarystructure[j].payheadMasterId == 78) {
                  finalsalary = penaltyDeductionCalculation(
                    LCEGPenaltyData,
                    attendanceTransData,
                    salary_CalculationDays,
                    gross,
                    salaryStructureBaseoncal,
                    salary_calculation_wise
                  );

                  finalsalary += PenaltyInSalary;

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalsalary),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: salarystructure[j].salaryfieldmaxrange,
                  });
                } else if (salarystructure[j].payheadMasterId == 96) {
                  // Deposit to deduction from salary
                  finalsalary = depositToDeduction.reduce(
                    (acc, obj) => acc + +obj.amount,
                    0
                  );

                  const result = Object.values(
                    depositToDeduction.reduce((acc, curr) => {
                      if (!acc[curr.depositcategory.depositcategoryname]) {
                        acc[curr.depositcategory.depositcategoryname] = {
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName: curr.depositcategory.depositcategoryname,
                          employeeAmount: 0,
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange: null,
                        };
                      }
                      acc[
                        curr.depositcategory.depositcategoryname
                      ].employeeAmount += curr.amount; // Sum the amount
                      return acc;
                    }, {})
                  );

                  userSalaryArray = [...userSalaryArray, ...result];

                  depositToDeductionArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalsalary),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: null,
                  });
                } else if (salarystructure[j].payheadMasterId == 97) {
                  // Deposit to pay in salary
                  finalsalary = depositToPay.reduce(
                    (acc, obj) => acc + +obj.amount,
                    0
                  );

                  const result = Object.values(
                    depositToPay.reduce((acc, curr) => {
                      if (!acc[curr.depositcategory.depositcategoryname]) {
                        acc[curr.depositcategory.depositcategoryname] = {
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName: curr.depositcategory.depositcategoryname,
                          employeeAmount: 0,
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange: null,
                        };
                      }
                      acc[
                        curr.depositcategory.depositcategoryname
                      ].employeeAmount += curr.amount; // Sum the amount
                      return acc;
                    }, {})
                  );

                  userSalaryArray = [...userSalaryArray, ...result];

                  depositToPayArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(finalsalary),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: null,
                  });
                } else if (salarystructure[j].payheadMasterId == 67) {
                  // Leave Encashment

                  const { amount, encashIds } = calculateLeaveEncashment(
                    allEmployeeLeavePolicy,
                    AllHrleaveTypes,
                    employeeLeaveEncashment,
                    AllsalarystructureData,
                    salary_calculation_wise,
                    salary_CalculationDays
                  );

                  // set encashids
                  finalEncashIds = encashIds;

                  userSalaryArray.push({
                    salaryMasterID: salarystructure[j].salaryMasterID,
                    payheadmasterid: salarystructure[j].payheadMasterId,
                    payheadName:
                      salarystructure[j].payheadDisplayName &&
                      salarystructure[j].payheadDisplayName.trim()
                        ? salarystructure[j].payheadDisplayName.trim()
                        : salarystructure[j].payheadName,
                    employeeAmount: Math.round(amount),
                    salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                    salaryfieldside: salarystructure[j].salaryFieldSide,
                    salaryfieldshow: salarystructure[j].salaryFieldShow,
                    calculatedOn: null,
                    salaryfieldmaxrange: null,
                  });
                } else if (salarystructure[j].payheadMasterId == 101) {
                  BonusPayData = salarystructure[j];
                } else {
                  // check depends on att
                  if (salarystructure[j].salaryFieldAttanChk == 0) {
                    finalsalary = +salarystructure[j].EmployeeSalaryAmount;
                  } else {
                    let oneminutesalry =
                      Number(salarystructure[j].EmployeeSalaryAmount) /
                      Number(60);

                    finalsalary =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                  }

                  //pf

                  if (
                    salarystructure[j].payheadMasterId == 4 ||
                    salarystructure[j].payheadMasterId == 5 ||
                    salarystructure[j].payheadMasterId == 12 ||
                    salarystructure[j].payheadMasterId == 25 ||
                    salarystructure[j].payheadMasterId == 66
                  ) {
                    let pf = 0;

                    if ([4, 12].includes(salarystructure[j].payheadMasterId)) {
                      pf =
                        (Number(salarystructure[j].EmployeeSalaryAmount) *
                          100) /
                        ((salarystructure[j].payheadMasterId == 4 ? 12 : 8.33) *
                          60);
                    }

                    let calculatedOn = Number(pf) * Number(usertotalpresentday);

                    userSalaryArray.push({
                      salaryMasterID: salarystructure[j].salaryMasterID,
                      payheadmasterid: salarystructure[j].payheadMasterId,
                      payheadName:
                        salarystructure[j].payheadDisplayName &&
                        salarystructure[j].payheadDisplayName.trim()
                          ? salarystructure[j].payheadDisplayName.trim()
                          : salarystructure[j].payheadName,
                      employeeAmount: +finalsalary,
                      salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                      salaryfieldside: salarystructure[j].salaryFieldSide,
                      salaryfieldshow: salarystructure[j].salaryFieldShow,
                      calculatedOn: [4, 12].includes(
                        salarystructure[j].payheadMasterId
                      )
                        ? +calculatedOn
                        : null,
                      salaryfieldmaxrange:
                        salarystructure[j].salaryfieldmaxrange,
                      salaryFieldRound: salarystructure[j].salaryFieldRound,
                      salaryFieldRoundNo: salarystructure[j].salaryFieldRoundNo,
                      roundOffType: salarystructure[j].roundOffType,
                    });
                  } else {
                    if (salarystructure[j].salaryFieldRound == 'Y') {
                      finalsalary =
                        salarystructure[j].roundOffType == 0
                          ? Math.ceil(finalsalary.toFixed(2))
                          : Math.round(finalsalary);
                    } else {
                      let salaryfieldroundno = Number(
                        salarystructure[j].salaryFieldRoundNo == null
                          ? 0
                          : salarystructure[j].salaryFieldRoundNo
                      );
                      finalsalary = Number(
                        finalsalary.toFixed(salaryfieldroundno)
                      );
                    }

                    if (salarystructure[j].salaryFieldWhenMonth[0] != '0') {
                      let currentmonth = Month;

                      if (Number(currentmonth) < 10) {
                        currentmonth = Month.slice(1);
                      }
                      let whencalculation =
                        salarystructure[j].salaryFieldWhenMonth;
                      whencalculation = whencalculation.filter((s) => {
                        return s == currentmonth;
                      });

                      if (whencalculation.length > 0) {
                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            salarystructure[j].payheadDisplayName &&
                            salarystructure[j].payheadDisplayName.trim()
                              ? salarystructure[j].payheadDisplayName.trim()
                              : salarystructure[j].payheadName,
                          employeeAmount: +finalsalary,
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          considerIn: salarystructure[j].considerIn,
                        });
                      } else {
                        userSalaryArray.push({
                          salaryMasterID: salarystructure[j].salaryMasterID,
                          payheadmasterid: salarystructure[j].payheadMasterId,
                          payheadName:
                            salarystructure[j].payheadDisplayName &&
                            salarystructure[j].payheadDisplayName.trim()
                              ? salarystructure[j].payheadDisplayName.trim()
                              : salarystructure[j].payheadName,
                          employeeAmount: 0,
                          salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                          salaryfieldside: salarystructure[j].salaryFieldSide,
                          salaryfieldshow: salarystructure[j].salaryFieldShow,
                          calculatedOn: null,
                          salaryfieldmaxrange:
                            salarystructure[j].salaryfieldmaxrange,
                          considerIn: salarystructure[j].considerIn,
                        });
                      }
                    } else {
                      userSalaryArray.push({
                        salaryMasterID: salarystructure[j].salaryMasterID,
                        payheadmasterid: salarystructure[j].payheadMasterId,
                        payheadName:
                          salarystructure[j].payheadDisplayName &&
                          salarystructure[j].payheadDisplayName.trim()
                            ? salarystructure[j].payheadDisplayName.trim()
                            : salarystructure[j].payheadName,
                        employeeAmount: +finalsalary,
                        salaryfieldsrno: salarystructure[j].salaryFieldSrNo,
                        salaryfieldside: salarystructure[j].salaryFieldSide,
                        salaryfieldshow: salarystructure[j].salaryFieldShow,
                        calculatedOn: null,
                        salaryfieldmaxrange:
                          salarystructure[j].salaryfieldmaxrange,
                        considerIn: salarystructure[j].considerIn,
                      });
                    }
                  }
                }
              }

              // ----------------------Bonus Pay Calculation ---------------------------------------
              if (BonusPayData) {
                const currentBonusAmount =
                  userSalaryArray.find((e) => e.payheadmasterid == 6)
                    ?.employeeAmount || 0;

                const { amount, ids, addcurrentId } = await getPayBonusAmount(
                  bonusPolicy,
                  yearmonth,
                  currentBonusAmount,
                  usermaster[i].userMasterID
                );

                BonusIds = ids;
                addCurrentBonusId = addcurrentId;

                userSalaryArray.push({
                  salaryMasterID: BonusPayData.salaryMasterID,
                  payheadmasterid: BonusPayData.payheadMasterId,
                  payheadName:
                    BonusPayData.payheadDisplayName &&
                    BonusPayData.payheadDisplayName.trim()
                      ? BonusPayData.payheadDisplayName.trim()
                      : BonusPayData.payheadName,
                  employeeAmount: Math.round(+amount),
                  salaryfieldsrno: BonusPayData.salaryFieldSrNo,
                  salaryfieldside: BonusPayData.salaryFieldSide,
                  salaryfieldshow: BonusPayData.salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: BonusPayData.salaryfieldmaxrange,
                  considerIn: BonusPayData.considerIn,
                });
              }

              //----------------- Push LWP Deduction in salary array------

              if (lwp_deduction) {
                userSalaryArray.push({
                  salaryMasterID: lwp_deduction.salaryMasterID,
                  payheadmasterid: lwp_deduction.payheadMasterId,
                  payheadName:
                    lwp_deduction.payheadDisplayName &&
                    lwp_deduction.payheadDisplayName.trim()
                      ? lwp_deduction.payheadDisplayName.trim()
                      : lwp_deduction.payheadName,
                  employeeAmount: 0,
                  salaryfieldsrno: lwp_deduction.salaryFieldSrNo,
                  salaryfieldside: lwp_deduction.salaryFieldSide,
                  salaryfieldshow: lwp_deduction.salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: lwp_deduction.salaryfieldmaxrange,
                  considerIn: lwp_deduction.considerIn,
                });
              }

              // deduct pf on overtime

              if (pfApplicable == 'true' || +pfIncentiveAmount > 0) {
                let pfDeductionAmount = 0;
                if (pfApplicable != 'true') {
                  pfDeductionAmount = +pfIncentiveAmount;
                } else {
                  pfDeductionAmount = +overtimeAmount + +pfIncentiveAmount;
                }

                userSalaryArray.forEach((e) => {
                  if (
                    e.payheadmasterid == 4 ||
                    e.payheadmasterid == 5 ||
                    e.payheadmasterid == 12 ||
                    e.payheadmasterid == 25 ||
                    e.payheadmasterid == 66
                  ) {
                    const amount =
                      Number(e.employeeAmount) +
                      (e.payheadmasterid == 4
                        ? (Number(pfDeductionAmount) * 12) / 100
                        : e.payheadmasterid == 5
                          ? (Number(pfDeductionAmount) * 3.67) / 100
                          : e.payheadmasterid == 12
                            ? (Number(pfDeductionAmount) * 8.33) / 100
                            : (Number(pfDeductionAmount) * 0.5) / 100);

                    e.employeeAmount =
                      e.salaryFieldRound == 'Y'
                        ? e.roundOffType == 0
                          ? Math.ceil(amount.toFixed(2))
                          : Math.round(amount)
                        : !e.salaryFieldRound
                          ? Math.round(amount)
                          : amount.toFixed(+e.salaryFieldRoundNo);

                    if ([4, 12].includes(e.payheadmasterid))
                      e.calculatedOn = Math.round(
                        Number(e.calculatedOn) + Number(pfDeductionAmount)
                      );
                  }
                });
              } else {
                userSalaryArray.forEach((e) => {
                  if (
                    e.payheadmasterid == 4 ||
                    e.payheadmasterid == 5 ||
                    e.payheadmasterid == 12 ||
                    e.payheadmasterid == 25 ||
                    e.payheadmasterid == 66
                  ) {
                    // const amount = Number(e.employeeAmount);

                    e.employeeAmount =
                      e.salaryFieldRound == 'Y'
                        ? e.roundOffType == 0
                          ? Math.ceil((+e.employeeAmount).toFixed(2))
                          : Math.round(+e.employeeAmount)
                        : !e.salaryFieldRound
                          ? Math.round(+e.employeeAmount)
                          : (+e.employeeAmount).toFixed(+e.salaryFieldRoundNo);

                    if ([4, 12].includes(e.payheadmasterid))
                      e.calculatedOn = Math.round(Number(e.calculatedOn));
                  }
                });
              }

              let ot_payheadMasterId,
                toAddOTInOtherPathead = false;

              // if attendancepolicy has show ot as add in payhead

              if (
                userAttendacepolicy &&
                userAttendacepolicy.toShowOT == 'addInPayhead'
              ) {
                ot_payheadMasterId = userAttendacepolicy.payheadMasterId;
                // Check if payhead id is  present or not in structure
                toAddOTInOtherPathead = userSalaryArray.find(
                  (e) => +e.payheadmasterid == +ot_payheadMasterId
                )
                  ? true
                  : false;
                // If present then add Amount
                if (toAddOTInOtherPathead) {
                  userSalaryArray = userSalaryArray.map((e) => {
                    if (+e.payheadmasterid == +ot_payheadMasterId)
                      e.employeeAmount += +overtimeAmount;
                    if (+e.payheadmasterid == 43) e.employeeAmount = 0;
                    return e;
                  });
                  // Set OT Array Empty
                  overtimeArray = [];
                }
              }

              // set max range

              userSalaryArray.map((e) => {
                if (e.salaryfieldmaxrange) {
                  if (+e.salaryfieldmaxrange < +e.employeeAmount) {
                    // pf
                    if (e.payheadmasterid == 4) {
                      e.calculatedOn = Math.round(
                        (+e.salaryfieldmaxrange * 100) / 12
                      );
                    }
                    // EPS
                    if (e.payheadmasterid == 12) {
                      e.calculatedOn =
                        e.salaryfieldmaxrange == 1250
                          ? 15000
                          : Math.round((+e.salaryfieldmaxrange * 100) / 8.33);
                    }
                    e.employeeAmount = +e.salaryfieldmaxrange;
                  }
                }
              });

              // ----------------------------- calculate EPF Amount  ---------------------------

              if (EPF_Data) {
                const PF_amount =
                  userSalaryArray.find((e) => e.payheadmasterid == 4)
                    ?.employeeAmount || 0;
                const EPS_amount =
                  userSalaryArray.find((e) => e.payheadmasterid == 12)
                    ?.employeeAmount || 0;

                const amount1 =
                  +PF_amount - +EPS_amount > 0 ? +PF_amount - +EPS_amount : 0;

                const employeeAmount =
                  EPF_Data.salaryFieldRound == 'Y'
                    ? EPF_Data.roundOffType == 0
                      ? Math.ceil((+amount1).toFixed(2))
                      : Math.round(+amount1)
                    : !EPF_Data.salaryFieldRound
                      ? Math.round(+amount1)
                      : (+amount1).toFixed(+EPF_Data.salaryFieldRoundNo);

                userSalaryArray.push({
                  salaryMasterID: EPF_Data.salaryMasterID,
                  payheadmasterid: EPF_Data.payheadMasterId,
                  payheadName:
                    EPF_Data.payheadDisplayName &&
                    EPF_Data.payheadDisplayName.trim()
                      ? EPF_Data.payheadDisplayName.trim()
                      : EPF_Data.payheadName,
                  employeeAmount,
                  salaryfieldsrno: EPF_Data.salaryFieldSrNo,
                  salaryfieldside: EPF_Data.salaryFieldSide,
                  salaryfieldshow: EPF_Data.salaryFieldShow,
                  calculatedOn: null,
                  salaryfieldmaxrange: EPF_Data.salaryfieldmaxrange,
                  considerIn: EPF_Data.considerIn,
                });
              }

              employee_gross = userSalaryArray
                .filter(
                  (e) =>
                    e.salaryfieldsrno == 'A' &&
                    e.salaryfieldshow == 'Y' &&
                    e.considerIn != 'net'
                )
                .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

              let employee_otherAmount = 0;

              userSalaryArray.filter((s) => {
                if (
                  s.salaryfieldside == 'D' &&
                  s.salaryfieldsrno != 'C' &&
                  s.employeeAmount != 0 &&
                  s.salaryfieldshow == 'Y'
                ) {
                  employee_otherAmount =
                    employee_otherAmount + +s.employeeAmount;
                }
              });

              // add amount in net pay
              employee_extraAddInNetPay = userSalaryArray
                .filter(
                  (e) =>
                    e.salaryfieldsrno == 'A' &&
                    e.salaryfieldshow == 'Y' &&
                    e.considerIn == 'net'
                )
                .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

              employee_netPay =
                Number(employee_gross) -
                Number(employee_otherAmount) +
                +employee_extraAddInNetPay;

              // employee PT
              const ptdata = salarystructure.filter((s) => {
                return s.payheadMasterId == 15;
              });

              if (ptdata.length > 0) {
                let get_one_data1 = await ProfessionalTaxSlabMaster.findOne({
                  where: {
                    stateMasterID: +ptdata[0].stateid,
                    fromAmount: { [Sequelize.Op.lte]: +employee_gross },
                    toAmount: { [Sequelize.Op.gte]: +employee_gross },
                    status: 1,
                    month: +Month,
                    applicableFromYYYYMM: {
                      [Sequelize.Op.lte]: String(yearmonth),
                    },
                  },
                  order: [['applicableFromYYYYMM', 'DESC']],
                });

                let value;
                if (get_one_data1) {
                  if (usermaster[i].gender == 'female') {
                    value = get_one_data1.femaleTax;
                  } else {
                    value = get_one_data1.maleTax;
                  }
                } else {
                  value = 0;
                }

                userSalaryArray.push({
                  salaryMasterID: ptdata[0].salaryMasterID,
                  payheadmasterid: ptdata[0].payheadMasterId,
                  payheadName:
                    ptdata[0].payheadDisplayName &&
                    ptdata[0].payheadDisplayName.trim()
                      ? ptdata[0].payheadDisplayName.trim()
                      : ptdata[0].payheadName,
                  employeeAmount: +value,
                  salaryfieldsrno: ptdata[0].salaryFieldSrNo,
                  salaryfieldside: ptdata[0].salaryFieldSide,
                  salaryfieldshow: ptdata[0].salaryFieldShow,
                  calculatedOn: null,
                });

                employee_netPay = Number(employee_netPay) - Number(value);
              }

              // employee esic

              const esicdata = salarystructure.filter((s) => {
                return s.payheadMasterId == 13;
              });

              if (esicdata.length > 0) {
                if (Number(esicdata[0].EmployeeSalaryAmount) > 0) {
                  let value = 0,
                    calculatedOn = 0;

                  if (esicDeduction == true) {
                    let oneminutesalry =
                      Number(esicdata[0].EmployeeSalaryAmount) / 60;

                    value =
                      Number(oneminutesalry) * Number(usertotalpresentday);
                    // calculated on value
                    const esic =
                      (Number(esicdata[0].EmployeeSalaryAmount) * 100) /
                      (0.75 * 60);

                    calculatedOn = Number(esic) * Number(usertotalpresentday);

                    value += +OtherEmployee_ESIC_Amount;
                    calculatedOn += +ESIC_CalculatedOn_Amount;

                    // if (esicApplicable == 'true' || +esicIncentiveAmount > 0) {
                    //   let esicDeductionAmount = 0;
                    //   if (esicApplicable != 'true') {
                    //     esicDeductionAmount = +esicIncentiveAmount;
                    //   } else {
                    //     esicDeductionAmount =
                    //       +overtimeAmount + +esicIncentiveAmount;
                    //   }
                    //   value =
                    //     Number(value) +
                    //     (Number(esicDeductionAmount) * 0.75) / 100;
                    //   calculatedOn += +esicDeductionAmount;
                    // }

                    // check max range

                    if (esicdata[0].salaryfieldmaxrange) {
                      if (+value > +esicdata[0].salaryfieldmaxrange) {
                        value = +esicdata[0].salaryfieldmaxrange;
                      }
                    }

                    value =
                      esicdata[0].salaryFieldRound == 'Y'
                        ? esicdata[0].roundOffType == 0
                          ? Math.ceil(value.toFixed(2))
                          : Math.round(value)
                        : !esicdata[0].salaryFieldRound
                          ? Math.round(value)
                          : value.toFixed(+esicdata[0].salaryFieldRoundNo);
                  }

                  userSalaryArray.push({
                    salaryMasterID: esicdata[0].salaryMasterID,
                    payheadmasterid: esicdata[0].payheadMasterId,
                    payheadName:
                      esicdata[0].payheadDisplayName &&
                      esicdata[0].payheadDisplayName.trim()
                        ? esicdata[0].payheadDisplayName.trim()
                        : esicdata[0].payheadName,
                    employeeAmount: +value,
                    salaryfieldsrno: esicdata[0].salaryFieldSrNo,
                    salaryfieldside: esicdata[0].salaryFieldSide,
                    salaryfieldshow: esicdata[0].salaryFieldShow,
                    calculatedOn:
                      +calculatedOn > 0 ? Math.round(+calculatedOn) : null,
                  });

                  employee_netPay = Number(employee_netPay) - Number(value);
                }
              }

              // company esic

              const co_esicdata = salarystructure.filter((s) => {
                return s.payheadMasterId == 14;
              });

              if (co_esicdata.length > 0) {
                if (Number(co_esicdata[0].EmployeeSalaryAmount) > 0) {
                  let value = 0;

                  if (esicDeduction == true) {
                    let oneminutesalry =
                      Number(co_esicdata[0].EmployeeSalaryAmount) / 60;

                    value =
                      Number(oneminutesalry) * Number(usertotalpresentday);

                    //SUM Of ESIC
                    value += +OtherEmployer_ESIC_Amount;

                    // max range

                    if (co_esicdata[0].salaryfieldmaxrange) {
                      if (+value > +co_esicdata[0].salaryfieldmaxrange) {
                        value = +co_esicdata[0].salaryfieldmaxrange;
                      }
                    }

                    value =
                      co_esicdata[0].salaryFieldRound == 'Y'
                        ? co_esicdata[0].roundOffType == 0
                          ? Math.ceil(value.toFixed(2))
                          : Math.round(value)
                        : !co_esicdata[0].salaryFieldRoundNo
                          ? Math.round(value)
                          : value.toFixed(+co_esicdata[0].salaryFieldRoundNo);
                  }

                  userSalaryArray.push({
                    salaryMasterID: co_esicdata[0].salaryMasterID,
                    payheadmasterid: co_esicdata[0].payheadMasterId,
                    payheadName:
                      co_esicdata[0].payheadDisplayName &&
                      co_esicdata[0].payheadDisplayName.trim()
                        ? co_esicdata[0].payheadDisplayName.trim()
                        : co_esicdata[0].payheadName,
                    employeeAmount: +value,
                    salaryfieldsrno: co_esicdata[0].salaryFieldSrNo,
                    salaryfieldside: co_esicdata[0].salaryFieldSide,
                    salaryfieldshow: co_esicdata[0].salaryFieldShow,
                    calculatedOn: null,
                  });
                }
              }

              // push incentive
              if (incentiveArray.length > 0) {
                userSalaryArray = userSalaryArray.filter((s) => {
                  return s.payheadmasterid != 24;
                });

                userSalaryArray = [...userSalaryArray, ...incentiveArray];
              }

              // push overtime

              if (overtimeArray.length > 0) {
                userSalaryArray = userSalaryArray.filter((s) => {
                  return s.payheadmasterid != 43;
                });

                userSalaryArray = [...userSalaryArray, ...overtimeArray];
              }

              let employeefinalsalary = userSalaryArray;

              const EmployerSideDeduction = userSalaryArray
                .filter((s) => s.salaryfieldsrno == 'C')
                .reduce((acc, obj) => acc + +obj.employeeAmount, 0);

              userSalaryArray = userSalaryArray.filter((s) => {
                return s.salaryfieldsrno != 'C' && s.salaryfieldshow == 'Y';
              });

              // show data

              for (let g = 0; g < userSalaryArray.length; g++) {
                if (
                  [
                    16, 17, 24, 34, 9, 43, 14, 13, 15, 78, 83, 99, 67, 101,
                  ].includes(userSalaryArray[g].payheadmasterid)
                ) {
                  if (userSalaryArray[g].employeeAmount != 0) {
                    showusersalary.push(userSalaryArray[g]);
                  }
                } else {
                  showusersalary.push(userSalaryArray[g]);
                }
              }

              let totalear = 0;
              let totaldedu = 0;
              // for final net pay

              showusersalary.filter((e) => {
                if (e.salaryfieldside == 'E') {
                  totalear = totalear + +e.employeeAmount;
                }
              });

              showusersalary.filter((e) => {
                if (e.salaryfieldside == 'D') {
                  totaldedu = totaldedu + +e.employeeAmount;
                }
              });

              employee_netPay = Number(totalear) - Number(totaldedu);

              // To check decimal or not

              if (
                +employee_netPay % 1 !== 0 &&
                CTC_GROSS_NET.find((e) => e.payheadMasterId == 92)
                  ?.salaryFieldRound == 'N'
              ) {
                employee_netPay = +employee_netPay.toFixed(
                  +CTC_GROSS_NET.find((e) => e.payheadMasterId == 92)
                    ?.salaryFieldRoundNo || 0
                );
              } else {
                employee_netPay = Math.round(+employee_netPay);
              }

              if (
                +employee_gross % 1 !== 0 &&
                CTC_GROSS_NET.find((e) => +e.payheadMasterId == 50)
                  ?.salaryFieldRound == 'N'
              ) {
                employee_gross = +employee_gross.toFixed(
                  +CTC_GROSS_NET.find((e) => e.payheadMasterId == 50)
                    ?.salaryFieldRoundNo || 0
                );
              } else {
                employee_gross = Math.round(+employee_gross);
              }

              let employee_ctc =
                +employee_gross +
                +employee_extraAddInNetPay +
                +EmployerSideDeduction;

              if (
                +employee_ctc % 1 !== 0 &&
                CTC_GROSS_NET.find((e) => e.payheadMasterId == 1)
                  ?.salaryFieldRound == 'N'
              ) {
                employee_ctc = +employee_ctc.toFixed(
                  +CTC_GROSS_NET.find((e) => e.payheadMasterId == 1)
                    ?.salaryFieldRoundNo || 0
                );
              } else {
                employee_ctc = Math.round(+employee_ctc);
              }

              //--------------------- Add CTC GROSS NET SALARY in salary Data ------------------------------

              CTC_GROSS_NET.forEach((e) => {
                if ([50, 92, 1].includes(e.payheadMasterId)) {
                  employeefinalsalary.push({
                    salaryMasterID: e.salaryMasterID,
                    payheadmasterid: e.payheadMasterId,
                    payheadName:
                      e.payheadDisplayName && e.payheadDisplayName.trim()
                        ? e.payheadDisplayName.trim()
                        : e.payheadName,
                    employeeAmount:
                      e.payheadMasterId == 50
                        ? +employee_gross
                        : e.payheadMasterId == 92
                          ? +employee_netPay
                          : +employee_ctc,
                    salaryfieldsrno: e.salaryFieldSrNo,
                    salaryfieldside: e.salaryFieldSide,
                    salaryfieldshow: e.salaryFieldShow,
                    calculatedOn: null,
                  });
                }
              });

              // combined incentive

              if (finalinsentivearray.length > 0) {
                employeefinalsalary = employeefinalsalary.filter((e) => {
                  return e.payheadmasterid != 24;
                });

                employeefinalsalary.push(finalinsentivearray[0]);
              }

              // combined penalty

              if (finalpenaltyarray.length > 0) {
                employeefinalsalary = employeefinalsalary.filter((e) => {
                  return e.payheadmasterid != 34;
                });

                employeefinalsalary.push(finalpenaltyarray[0]);
              }

              // Final Deposit of deduction
              if (depositToDeductionArray.length) {
                employeefinalsalary = employeefinalsalary.filter((e) => {
                  return e.payheadmasterid != 96;
                });

                employeefinalsalary.push(depositToDeductionArray[0]);
              }

              // Final Deposit of Pay
              if (depositToPayArray.length) {
                employeefinalsalary = employeefinalsalary.filter((e) => {
                  return e.payheadmasterid != 97;
                });

                employeefinalsalary.push(depositToPayArray[0]);
              }

              const advanceIds =
                advanceData.length > 0
                  ? advanceData.map((e) => e.advancePaymentID)
                  : [];
              const loantranIds =
                loanData.length > 0
                  ? loanData.map((e) => e.LoanTrasactionId)
                  : [];
              const penaltyIds =
                penaltydata.length > 0
                  ? penaltydata.map((e) => e.employeePenaltyID)
                  : [];
              const incentiveIds =
                incentiveData.length > 0
                  ? incentiveData.map((e) => e.employeeincentiveID)
                  : [];

              let currentBonusData = null;

              // add salary

              for (let l = 0; l < employeefinalsalary.length; l++) {
                let add_data = await HrSalaryTrans.create(
                  {
                    userMasterID: usermaster[i].userMasterID,
                    salaryMasterID: employeefinalsalary[l].salaryMasterID,
                    salaryYYYYMM: yearmonth,
                    EmployeeSalaryPer: 0,
                    EmployeeSalaryAmount: employeefinalsalary[l].employeeAmount,
                    SalaryCalcOnDays: usertotalpresentday,
                    createBy: createBy,
                    createByIp: createByIp,
                    calculatedOn: employeefinalsalary[l].calculatedOn,
                  },
                  { transaction: t }
                );

                // Bonus
                if (
                  employeefinalsalary[l].payheadmasterid == 6 &&
                  +employeefinalsalary[l].employeeAmount > 0
                ) {
                  currentBonusData = await EmployeeBonus.create(
                    {
                      userMasterID: usermaster[i].userMasterID,
                      amount: Math.round(
                        +employeefinalsalary[l].employeeAmount
                      ),
                      bonusYYYYMM: yearmonth,
                      referenceId: add_data.userSalaryTranID,
                    },
                    {
                      user: req.userDetails,
                      transaction: t,
                    }
                  );
                }

                // Pay Bonus

                if (
                  employeefinalsalary[l].payheadmasterid == 101 &&
                  BonusPayData &&
                  (BonusIds.length || addCurrentBonusId)
                ) {
                  await EmployeeBonus.update(
                    {
                      payReferenceId: add_data.userSalaryTranID,
                      payYYYYMM: yearmonth,
                    },
                    {
                      where: {
                        id: {
                          [Sequelize.Op.in]: BonusIds,
                        },
                      },
                      individualHooks: true,
                      user: req.userDetails,
                      transaction: t,
                    }
                  );

                  if (addCurrentBonusId && currentBonusData) {
                    await currentBonusData.update(
                      {
                        payReferenceId: add_data.userSalaryTranID,
                        payYYYYMM: yearmonth,
                      },
                      {
                        user: req.userDetails,
                        transaction: t,
                      }
                    );
                  }
                }

                //  update Advance
                if (
                  employeefinalsalary[l].payheadmasterid == 16 &&
                  advanceIds.length > 0
                ) {
                  await advancePayments.update(
                    {
                      tablereferenceID: add_data.userSalaryTranID,
                      tableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        advancePaymentID: advanceIds,
                      },
                      transaction: t,
                    }
                  );
                }

                // update Loan
                if (
                  employeefinalsalary[l].payheadmasterid == 17 &&
                  loantranIds.length > 0
                ) {
                  await LoanTransactions.update(
                    {
                      RefrenceId: add_data.userSalaryTranID,
                      TableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        LoanTrasactionId: loantranIds,
                      },
                      transaction: t,
                    }
                  );
                }

                // update Penalty

                if (
                  employeefinalsalary[l].payheadmasterid == 34 &&
                  penaltyIds.length > 0
                ) {
                  await employeePenalties.update(
                    {
                      RefrenceId: add_data.userSalaryTranID,
                      TableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        employeePenaltyID: penaltyIds,
                      },
                      transaction: t,
                    }
                  );
                }

                // update incentive

                if (
                  employeefinalsalary[l].payheadmasterid == 24 &&
                  incentiveIds.length > 0
                ) {
                  await Employeeincentive.update(
                    {
                      ReferenceId: add_data.userSalaryTranID,
                      TableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        employeeincentiveID: incentiveIds,
                      },
                      transaction: t,
                    }
                  );
                }
                // update overtimecal

                if (
                  employeefinalsalary[l].payheadmasterid == 43 &&
                  +employeefinalsalary[l].employeeAmount > 0
                ) {
                  await OverTimeCalculationMains.update(
                    {
                      ReferenceId: add_data.userSalaryTranID,
                      tableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        userMasterID: usermaster[i].userMasterID,
                        yyyymm: yearmonth,
                      },
                      transaction: t,
                    }
                  );
                }

                // update deposits

                if (
                  depositToDeduction.length &&
                  employeefinalsalary[l].payheadmasterid == 96
                ) {
                  await deposit.update(
                    {
                      ReferenceId: add_data.userSalaryTranID,
                      TableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        depositId: depositToDeduction.map((e) => e.depositId),
                      },
                      transaction: t,
                    }
                  );
                }

                // update deposits

                if (
                  depositToPay.length &&
                  employeefinalsalary[l].payheadmasterid == 97
                ) {
                  await deposit.update(
                    {
                      ReferenceId: add_data.userSalaryTranID,
                      TableName: 'hrSalaryTrasactions',
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        depositId: depositToPay.map((e) => e.depositId),
                      },
                      transaction: t,
                    }
                  );
                }

                // update leaveEncashment

                if (
                  finalEncashIds.length &&
                  employeefinalsalary[l].payheadmasterid == 67
                ) {
                  await LeaveEncashment.update(
                    {
                      referenceId: add_data.userSalaryTranID,
                      updateBy: createBy,
                      updateByIp: createByIp,
                    },
                    {
                      where: {
                        id: {
                          [Sequelize.Op.in]: finalEncashIds,
                        },
                      },
                      transaction: t,
                    }
                  );
                }
              }
            }
          }

          // update FNF Data

          if (from == 'FNF') {
            await UserMaster.update(
              {
                isFNF: true,
                fnfMonth: yearmonth,
              },
              {
                where: {
                  userMasterID: usermaster[i].userMasterID,
                },
                transaction: t,
              }
            );
          }

          // salary slip generation

          const find_salaryslip = usermaster[i].hrSalarySlips?.[0] || null;

          if (find_salaryslip) {
            await HrSalarySlip.destroy({
              where: {
                userMasterID: usermaster[i].userMasterID,
                salaryYYYYMM: yearmonth,
              },
              transaction: t,
            });
          }

          let leavedata = calculatedAttendanceData;

          // penalty
          let attendancePenalty =
            leavedata.find((e) => e['hrLeaveType.LeaveID'] == 22)?.AttnVal || 0;

          let check_hourly = leavedata.filter((e) => {
            return e['hrLeaveType.LeaveID'] == 20;
          });

          let salarycalculated;
          let final_workinghour = 0;
          let showovertime = false;
          let final_ot = 0;

          if (check_hourly.length > 0) {
            salarycalculated = 'hourly';

            // check attendance penalty

            attendancePenalty =
              +attendancePenalty > 0
                ? attendancePenalty
                : LCEGPenaltyData.find(
                    (e) => e.penaltyType == LCEGPenaltyTypeEnum.MINUTE
                  )?.penaltyValue || 0;

            let working_hour = Number(check_hourly[0].AttnVal) / 60;
            let working_min = Number(check_hourly[0].AttnVal) % 60;

            if (Number(working_min) > 0) {
              if (Number(working_min) < 10) {
                working_min = '0' + working_min;
              }

              final_workinghour = Math.trunc(working_hour) + '.' + working_min;
            } else {
              final_workinghour = Math.trunc(working_hour);
            }

            if (+attendancePenalty > 0) {
              let penalty_hour = Number(attendancePenalty) / 60;
              let penalty_min = Number(attendancePenalty) % 60;

              if (Number(penalty_min) > 0) {
                if (Number(penalty_min) < 10) {
                  penalty_min = '0' + penalty_min;
                }

                attendancePenalty =
                  Math.trunc(penalty_hour) + '.' + penalty_min;
              } else {
                attendancePenalty = Math.trunc(penalty_hour);
              }
            }

            if (userAttendacepolicy) {
              let showinsalaryslip = userAttendacepolicy.showinsalaryslip;

              if (showinsalaryslip == 'true') {
                let overtime = leavedata.filter((e) => {
                  return (
                    e['hrLeaveType.LeaveID'] == 21 && Number(e.AttnVal) > 0
                  );
                });

                if (overtime.length > 0) {
                  showovertime = true;

                  let ot_hour = Number(overtime[0].AttnVal) / 60;
                  let ot_min = Number(overtime[0].AttnVal) % 60;

                  if (Number(ot_min) > 0) {
                    if (Number(ot_min) < 10) {
                      ot_min = '0' + ot_min;
                    }

                    final_ot = Math.trunc(ot_hour) + '.' + ot_min;
                  } else {
                    final_ot = Math.trunc(ot_hour);
                  }
                } else {
                  final_ot = 0;
                }
              }
            }
          } else {
            salarycalculated = 'monthly';
            attendancePenalty =
              +attendancePenalty > 0
                ? attendancePenalty
                : LCEGPenaltyData.find(
                    (e) => e.penaltyType == LCEGPenaltyTypeEnum.DAY
                  )?.penaltyValue || 0;
          }

          // show overtime

          if (+overtime_min > 0) {
            showovertime = true;

            let ot_hour = +overtime_min / 60;
            let ot_min = +overtime_min % 60;

            if (+ot_min > 0) {
              if (+ot_min < 10) {
                ot_min = '0' + ot_min;
              }

              final_ot = Math.trunc(ot_hour) + '.' + ot_min;
            } else {
              final_ot = Math.trunc(ot_hour);
            }
          }

          const finalpresentday =
            leavedata.find((e) => e['hrLeaveType.LeaveID'] == 1)?.AttnVal || 0;
          const finalweekoff =
            leavedata.find((e) => e['hrLeaveType.LeaveID'] == 7)?.AttnVal || 0;
          const finalholiday =
            leavedata.find((e) => e['hrLeaveType.LeaveID'] == 9)?.AttnVal || 0;

          const finalpaidleave = leavedata
            .filter(
              (e) =>
                ![1, 5, 7, 9, 18, 20, 21, 22, 28, 25].includes(
                  +e['hrLeaveType.LeaveID']
                )
            )
            .reduce((acc, obj) => acc + +obj.AttnVal, 0);

          const finalunpaidleave = leavedata
            .filter((e) => [5, 18, 28].includes(+e['hrLeaveType.LeaveID']))
            .reduce((acc, obj) => acc + +obj.AttnVal, 0);

          const outDoorDuty = leavedata
            .filter((e) => e['hrLeaveType.LeaveID'] == 25)
            .reduce((acc, obj) => acc + obj.AttnVal, 0);
          const compensatoryOff = leavedata
            .filter((e) => e['hrLeaveType.LeaveID'] == 6)
            .reduce((acc, obj) => acc + obj.AttnVal, 0);
          // set actualAmount in salary slip

          showusersalary.map((e) => {
            const findpayhead = salarystructure.filter((s) => {
              return s.salaryMasterID == e.salaryMasterID;
            });

            if (findpayhead.length > 0) {
              e.actualamount = findpayhead[0].EmployeeSalaryAmount;
            } else {
              e.actualamount = 0;
            }
          });

          const earning = showusersalary.filter((e) => {
            return (
              e.salaryfieldside == 'E' &&
              e.salaryfieldshow == 'Y' &&
              e.considerIn != 'net'
            );
          });

          const deduction = showusersalary.filter((e) => {
            return e.salaryfieldside == 'D' && e.salaryfieldshow == 'Y';
          });
          // -------------------Extra Earning payhead  ---------------
          const extra_earning = showusersalary.filter((e) => {
            return (
              e.salaryfieldside == 'E' &&
              e.salaryfieldshow == 'Y' &&
              e.considerIn == 'net'
            );
          });

          let totaldeduction = 0;

          if (deduction.length > 0) {
            totaldeduction = deduction.reduce((accumulator, object) => {
              return accumulator + object.employeeAmount;
            }, 0);
          } else {
            totaldeduction = 0;
          }

          // To check decimal or not

          if (+totaldeduction % 1 !== 0) {
            totaldeduction = (+totaldeduction).toFixed(2);
          }

          //  net pay in words
          // const numbertext = converter.toWords(employee_netPay);

          //  net pay in words
          // const numbertext1 = converter.toWords(employee_netPay);

          // function capitalizeWords(string) {
          //   if (!string) return '';
          //   return string.replace(/\b\w/g, (char) => char.toUpperCase());
          // }
          // const numbertext = capitalizeWords(numbertext1);

          const numbertext = toWords.convert(employee_netPay);

          const monthName = month_dict[String(yearmonth).slice(4, 6)];

          if (earning.length > deduction.length) {
            for (var o = 0; o < earning.length; o++) {
              if (
                deduction[o] != undefined ||
                deduction[o] != null ||
                deduction[o] != ''
              ) {
                deduction[o] = deduction[o];
              } else {
                deduction[o].payheadName = '';
                deduction[o].employeeAmount = '';
              }

              if (earning[o].actualamount == 0) {
                earning[o].actualamount = '';
              }
            }
          } else {
            for (var f = 0; f < deduction.length; f++) {
              if (
                earning[f] != undefined ||
                earning[f] != null ||
                earning[f] != ''
              ) {
                earning[f] = earning[f];
              } else {
                earning[f].push({ payheadName: '', employeeAmount: '' });
              }
            }
          }

          let joiningmonth = employeeJoining
            ? employeeJoining.joiningDate.slice(5, 7)
            : '';
          let month2 = monthNames[joiningmonth - 1];
          let joiningdate =
            (employeeJoining ? employeeJoining.joiningDate.slice(8, 10) : '') +
            ' - ' +
            month2 +
            ' - ' +
            (employeeJoining ? employeeJoining.joiningDate.slice(0, 4) : '');

          const startDate =
            start_date.slice(8, 10) +
            ' - ' +
            monthNames[start_date.slice(5, 7) - 1] +
            ' - ' +
            start_date.slice(0, 4);

          const endDate =
            end_date.slice(8, 10) +
            ' - ' +
            monthNames[end_date.slice(5, 7) - 1] +
            ' - ' +
            end_date.slice(0, 4);

          let salarySlipName;
          let otHrs = 0;

          const companyMasterId = +usermaster[i].companyMasterId;

          switch (companyMasterId) {
            case 277:
            case 298:
              salarySlipName = 'salaryslipForAsoPalav';
              break;
            case 560:
            case 630:
              salarySlipName = 'salarySlipForJeevdani';
              const otData = All_OT_Cal.find(
                (e) => e.userMasterID == +usermaster[i].userMasterID
              );
              otHrs = otData ? (+otData.overtimehrs / 60).toFixed(2) : 0;
              break;
            case 543:
              salarySlipName = 'salarySlipForFinTechFilings';
              break;
            case 744: //Parent Company
            // Child Company
            case 965:
            case 968:
            case 969:
            case 970:
            case 971:
            case 998:
            case 999:
            case 1000:
            // For Testing Of Salary Of Savera
            case 804:
              salarySlipName = 'saveraGroupPaySlip';
              break;
            case 1045:
              salarySlipName = 'salarySlipTechcedence';
              break;
            default:
              salarySlipName = 'salaryslip';
              break;
          }
          const contractorData =
            employeeJoining && employeeJoining.contractor
              ? employeeJoining.contractor
              : null;

          const contractorAddressData = contractorData
            ? `${contractorData.contractorAddress ? contractorData.contractorAddress + ',' : ''} ${contractorData.cityMaster.cityName}, ${contractorData.cityMaster.stateMaster.stateName}, ${contractorData.cityMaster.stateMaster.countryMaster.countryName}`
            : '';
          const data = {
            companylogo: usermaster[i].companyMaster
              ? usermaster[i].companyMaster.companyLogo
              : '',
            companyname: usermaster[i].companyMaster
              ? usermaster[i].companyMaster.companyName
              : '',
            companyaddress: usermaster[i].companyMaster
              ? usermaster[i].companyMaster.companyAddress
              : '',
            employeecode: employeeJoining ? employeeJoining.employeeCode : '',
            employeename: usermaster[i].displayName,
            joiningdate: joiningdate,
            uanNumber: employeeJoining ? employeeJoining.uanNumber : '',
            pfNumber: employeeJoining ? employeeJoining.pfNumber : '',
            pancard: employeeJoining ? employeeJoining.pancard : '',
            esicNumber: employeeJoining ? employeeJoining.esicNumber : '',
            branch: employeeBranch,
            branchAddress: employeeBranchAddress,
            department: employeeDepartment,
            designation: employeeDesignation,
            monthDays: monday,
            presentday: finalpresentday,
            weekoff: finalweekoff,
            holiday: finalholiday,
            unpaidleave: finalunpaidleave,
            paidleave: finalpaidleave,
            workinghour: final_workinghour,
            overtimehour: final_ot,
            attendancePenalty: attendancePenalty,
            attendancePenaltyShow: +attendancePenalty > 0 ? true : false,
            salarycalculated: salarycalculated,
            overtimeshow: showovertime,

            earning: earning,
            deduction: deduction,
            extra_earning,
            totaldeduction: totaldeduction,
            totalearning: employee_gross,
            totalactualearning: gross,
            nettotal: employee_netPay,
            numbertext: numbertext + ' Rupees Only.',
            numberTextMarathi: `${numbertext} Rupees Only ( ${toMarathiWords.convert(employee_netPay)} )`,

            month: monthName,
            year: year,
            start_date: startDate,
            end_date: endDate,
            otHrs,
            CIN_Number: usermaster[i].companyMaster
              ? usermaster[i].companyMaster.cinNumber
              : '',
            companyWebsite: usermaster[i].companyMaster
              ? usermaster[i].companyMaster.companyWebsite
              : '',
            outDoorDuty,
            ApiURL: mainApiUrl,
            usersContractorName: contractorData
              ? contractorData.contractorName
              : '',
            usersContractorAddress: contractorAddressData
              ? contractorAddressData
              : '',
            userbankAccountNo:
              employeeJoining && employeeJoining.bankAccountNo
                ? employeeJoining.bankAccountNo
                : '',
            userbankName:
              employeeJoining && employeeJoining.bankMaster
                ? employeeJoining.bankMaster.bankName
                : '',
            payableDays: usertotalpresentday,
            compensatoryOff,
          };

          // let salarySlipName;
          // if (
          //   +usermaster[i].companyMasterId == 277 ||
          //   +usermaster[i].companyMasterId == 298
          // ) {
          //   salarySlipName = 'salaryslipForAsoPalav';
          // } else {
          //   salarySlipName = 'salaryslip';
          // }
          let base64path = '';
          if (salarySlipName != 'saveraGroupPaySlip') {
            const filePath = getTemplate(salarySlipName);
            const file = await readFile(filePath);
            const template = Handlebars.compile(file);
            const html = template(data);

            const browser = await puppeteer.launch({
              args: ['--no-sandbox'],
              headless: 'new',
            });
            const page = await browser.newPage();

            // Set the HTML content of the page
            await page.setContent(html);

            // Generate PDF
            const buffer = await page.pdf({
              format: 'A4', // Page format (A4 in this case)
              printBackground: true, // print background
              // margin: { top: '20px', bottom: '20px' },
            });

            let userid = usermaster[i].userMasterID;
            base64path = Buffer.from(buffer).toString('base64');
            await browser.close();
          } else {
            function findLeaveBalance(leavebalance, LeaveID) {
              const findLeave =
                leavebalance && leavebalance.length > 0
                  ? leavebalance.find((e) => e.LeaveID == LeaveID)
                  : null;
              return findLeave ? findLeave.Balance : 0;
            }
            const leavebalance = await employeeeLeaveBalance(
              +usermaster[i].companyMasterId,
              +usermaster[i].userMasterID
            );
            data.remainingBalance_CL = findLeaveBalance(leavebalance, 2);
            data.remainingBalance_SL = findLeaveBalance(leavebalance, 10);
            data.remainingBalance_PL = findLeaveBalance(leavebalance, 3);
            data.remainingBalance_OD = findLeaveBalance(leavebalance, 25);
            data.remainingBalance_CO = findLeaveBalance(leavebalance, 6);
            base64path = await generateHTMLToPDF_base64Path(
              data,
              salarySlipName,
              'portrait',
              'html' //File Extension
            );
          }
          await HrSalarySlip.create({
            userMasterID: +usermaster[i].userMasterID,
            salaryYYYYMM: yearmonth,
            path: base64path,
            salarySlipIssue: 0,
            createBy: createBy,
            createByIp: createByIp,
          });
        });
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Salary calculated successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.deletesalary = async (req, res, next) => {
  try {
    function daysInMonth(month, year) {
      return new Date(year, month, 0).getDate();
    }

    let year = req.body.yyyymm.slice(0, 4);
    let Month = req.body.yyyymm.slice(4, 6);
    let monday = daysInMonth(Month, year);

    let enddate = year + '-' + Month + '-' + monday;

    const user_salaryPolicy = await employeeSalaryPolicy(
      req.body.userMasterID,
      enddate
    );

    let start_date;
    let end_date;
    if (user_salaryPolicy) {
      let year = req.body.yyyymm.slice(0, 4);
      let Month = req.body.yyyymm.slice(4, 6);

      let date = user_salaryPolicy['salaryPolicy.salaryCycleDate'];

      date = (date < 10 ? '0' : '') + date;

      start_date = year + '-' + Month + '-' + date;

      var date1 = new Date(start_date);
      date1.setDate(date1.getDate() + (monday - 1));

      end_date =
        date1.getFullYear() +
        '-' +
        String(date1.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date1.getDate()).padStart(2, '0');
    } else {
      let date = '01';
      start_date = year + '-' + Month + '-' + date;
      end_date = year + '-' + Month + '-' + monday;
    }

    let result = await sequelize.transaction(async (t) => {
      let userAdvance = await advancePayments.findAll({
        where: {
          userMasterID: req.body.userMasterID,
          paymentYearMonth: req.body.yyyymm,
          status: 1,
        },
      });

      if (userAdvance.length > 0) {
        for (var c = 0; c < userAdvance.length; c++) {
          let update_advance = await advancePayments.update(
            {
              tablereferenceID: null,
              tableName: null,
              updateBy: req.body.createBy,
              updateByIp: req.body.createByIp,
            },
            {
              where: {
                advancePaymentID: userAdvance[c].advancePaymentID,
              },
              transaction: t,
            }
          );
        }
      }

      // update Loan
      // if (employeefinalsalary[l].payheadmasterid == 17) {

      let userLoan = await LoanTransactions.findAll({
        where: {
          '$loanMaster.userMasterID$': req.body.userMasterID,
          EMIMonth: req.body.yyyymm,
          status: 1,
        },
        include: [{ model: LoanMaster }],
      });

      if (userLoan.length > 0) {
        for (var d = 0; d < userLoan.length; d++) {
          let update_Loan = await LoanTransactions.update(
            {
              RefrenceId: null,
              TableName: null,
              updateBy: req.body.createBy,
              updateByIp: req.body.createByIp,
            },
            {
              where: {
                LoanTrasactionId: userLoan[d].LoanTrasactionId,
              },
              transaction: t,
            }
          );
        }
      }

      // update Penalty

      // if (employeefinalsalary[l].payheadmasterid == 34) {

      let userPenalty = await employeePenalties.findAll({
        where: {
          userMasterID: req.body.userMasterID,
          penaltyDate: {
            [Sequelize.Op.between]: [start_date, end_date],
          },
          status: 1,
        },
      });

      if (userPenalty.length > 0) {
        for (var e = 0; e < userPenalty.length; e++) {
          let update_penalty = await employeePenalties.update(
            {
              RefrenceId: null,
              TableName: null,
              updateBy: req.body.createBy,
              updateByIp: req.body.createByIp,
            },
            {
              where: {
                employeePenaltyID: userPenalty[e].employeePenaltyID,
              },
            }
          );
        }
      }

      let change_data_status = await HrSalaryTrans.destroy({
        where: {
          userMasterID: req.body.userMasterID,
          salaryYYYYMM: req.body.yyyymm,
        },
        transaction: t,
      });

      let delete_salaryslip = await HRSalarySlip.destroy({
        where: {
          userMasterID: req.body.userMasterID,
          salaryYYYYMM: req.body.yyyymm,
        },
        transaction: t,
      });

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.salarydelte });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAllsalary = async (req, res, next) => {
  try {
    const { userMasterID = [], yearmonth, from = 'salary' } = await req.body;

    await sequelize.transaction(async (t) => {
      const AllsalaryData = await HRSalaryTrasaction.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
          salaryYYYYMM: yearmonth,
        },
        include: [
          {
            required: true,
            model: HRSalaryMaster,
            as: 'HSM',
            attributes: ['gradeSalaryStructureID'],
            include: [
              {
                required: true,
                model: GradeSalaryStructure,
                as: 'GSS',
                attributes: ['salaryFieldID'],
                include: [
                  {
                    required: true,
                    model: HRSalaryFields,
                    as: 'HSF',
                    where: {
                      payheadMasterId: {
                        [Sequelize.Op.in]: [16, 17, 24, 34, 43, 96, 67, 101, 6],
                      },
                    },
                    attributes: ['payheadMasterId'],
                  },
                ],
              },
            ],
          },
          {
            required: false,
            model: EmployeePenalty,
            attributes: ['RefrenceId', 'employeePenaltyID'],
          },
          {
            required: false,
            model: Employeeincentive,
            attributes: ['ReferenceId', 'employeeincentiveID'],
          },
          {
            required: true,
            model: UserMaster,
            attributes: ['isFNF', 'fnfMonth', 'userMasterID'],
            include: [
              {
                model: HrSalarySlip,
                where: { salaryYYYYMM: yearmonth, paid: false },
                attributes: [],
              },
            ],
          },
        ],
      });
      // filter FNF

      const finalUserIds = [
        ...new Set(AllsalaryData.map((e) => e.userMasterID)),
      ];

      let salaryData = AllsalaryData;
      let excludeIds = [];
      let final_UserMasterID = userMasterID;

      if (from == 'salary') {
        excludeIds = [
          ...new Set(
            AllsalaryData.filter((e) => e.userMaster.fnfMonth == yearmonth).map(
              (a) => +a.userMasterID
            )
          ),
        ];
        salaryData = AllsalaryData.filter(
          (e) => !excludeIds.includes(+e.userMasterID)
        );
        final_UserMasterID = finalUserIds.filter(
          (e) => !excludeIds.includes(+e)
        );
      }

      // Employee Incentive

      const INC_Ids = salaryData.flatMap((e) =>
        (e.employeeincentives || []).map((inc) => inc.employeeincentiveID)
      );

      const Penalty_Ids = salaryData.flatMap((e) =>
        (e.employeePenalties || []).map((inc) => inc.employeePenaltyID)
      );

      const Loan_Ids = [],
        Adv_ids = [],
        OT_Ids = [],
        deposit_Ids = [],
        LeaveENC_Ids = [],
        bonus_Ids = [],
        bonusPay_Ids = [];

      salaryData.forEach((e) => {
        if (e.HSM.GSS.HSF.payheadMasterId == 16)
          Adv_ids.push(e.userSalaryTranID);
        if (e.HSM.GSS.HSF.payheadMasterId == 17)
          Loan_Ids.push(e.userSalaryTranID);
        if (e.HSM.GSS.HSF.payheadMasterId == 43)
          OT_Ids.push(e.userSalaryTranID);
        if (e.HSM.GSS.HSF.payheadMasterId == 96)
          deposit_Ids.push(e.userSalaryTranID);
        if (e.HSM.GSS.HSF.payheadMasterId == 67)
          LeaveENC_Ids.push(e.userSalaryTranID);
        if (e.HSM.GSS.HSF.payheadMasterId == 6)
          bonus_Ids.push(e.userSalaryTranID);
        if (e.HSM.GSS.HSF.payheadMasterId == 101)
          bonusPay_Ids.push(e.userSalaryTranID);
      });

      // update data

      const updateArray = [];
      // Employee Incentives
      if (INC_Ids.length) {
        updateArray.push(
          Employeeincentive.update(
            {
              TableName: null,
              ReferenceId: null,
            },
            {
              where: {
                employeeincentiveID: {
                  [Sequelize.Op.in]: INC_Ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // Employee Penalty
      if (Penalty_Ids.length) {
        updateArray.push(
          EmployeePenalty.update(
            {
              TableName: null,
              RefrenceId: null,
            },
            {
              where: {
                employeePenaltyID: {
                  [Sequelize.Op.in]: Penalty_Ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // loan
      if (Loan_Ids.length) {
        updateArray.push(
          LoanTransactions.update(
            {
              TableName: null,
              RefrenceId: null,
            },
            {
              where: {
                RefrenceId: {
                  [Sequelize.Op.in]: Loan_Ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // advance
      if (Adv_ids.length) {
        updateArray.push(
          advancePayment.update(
            {
              tableName: null,
              tablereferenceID: null,
            },
            {
              where: {
                tablereferenceID: {
                  [Sequelize.Op.in]: Adv_ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // OT
      if (OT_Ids.length) {
        updateArray.push(
          overTimeCalculationMain.update(
            {
              tableName: null,
              ReferenceId: null,
            },
            {
              where: {
                ReferenceId: {
                  [Sequelize.Op.in]: OT_Ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // Deposit
      if (deposit_Ids.length) {
        updateArray.push(
          deposit.update(
            {
              ReferenceId: null,
              TableName: null,
            },
            {
              where: {
                ReferenceId: {
                  [Sequelize.Op.in]: deposit_Ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // Leave Encashment
      if (LeaveENC_Ids.length) {
        updateArray.push(
          LoanTransactions.update(
            {
              referenceId: null,
            },
            {
              where: {
                referenceId: {
                  [Sequelize.Op.in]: LeaveENC_Ids,
                },
              },
              transaction: t,
            }
          )
        );
      }

      // update Bonus

      if (bonus_Ids.length) {
        updateArray.push(
          EmployeeBonus.destroy({
            where: {
              referenceId: {
                [Sequelize.Op.in]: bonus_Ids,
              },
            },
            individualHooks: true,
            user: req.userDetails,
            transaction: t,
          })
        );
      }

      // update Bonus Pay

      if (bonusPay_Ids.length) {
        updateArray.push(
          EmployeeBonus.update(
            {
              payReferenceId: null,
            },
            {
              where: {
                payReferenceId: {
                  [Sequelize.Op.in]: bonusPay_Ids,
                },
              },
              individualHooks: true,
              user: req.userDetails,
              transaction: t,
            }
          )
        );
      }

      await Promise.all(updateArray);

      // update FNF process
      if (from == 'FNF') {
        await UserMaster.update(
          {
            isFNF: false,
            fnfMonth: null,
          },
          {
            where: {
              userMasterID: final_UserMasterID,
            },
            transaction: t,
          }
        );
      }

      await HrSalaryTrans.destroy({
        where: {
          userMasterID: { [Sequelize.Op.in]: final_UserMasterID },
          salaryYYYYMM: yearmonth,
        },
        transaction: t,
      });

      await HRSalarySlip.destroy({
        where: {
          userMasterID: { [Sequelize.Op.in]: final_UserMasterID },
          salaryYYYYMM: yearmonth,
        },
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.salarydelte,
    });
  } catch (err) {
    next(err);
  }
};

async function employeebranch(userid) {
  let get_one_data = await EmployeeBranch.findAll({
    where: {
      userMasterID: userid,
      status: 1,
    },
    order: [['applicableDate', 'ASC']],
    include: [{ all: true }],
  }); // Find User Shift

  // Date Wise Active Deactive
  if (get_one_data.length == 1) {
    if (
      new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
      new Date().toISOString().slice(0, 10)
    ) {
      get_one_data[0].dataValues.branchstatus = 'deactive';
    } else {
      get_one_data[0].dataValues.branchstatus = 'active';
    }
  } else if (get_one_data.length == 0) {
  } else {
    let startdates = [];
    for (var j = 0; j < get_one_data.length; j++) {
      startdates.push(new Date(get_one_data[j].applicableDate));
    }
    const dateArr = startdates.sort((a, b) => a - b);
    const nearestPastDate = (dateArr, date) => {
      const pastArr = dateArr.filter((n) => n <= date);
      return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
    };
    const past = nearestPastDate(dateArr, new Date())
      .toISOString()
      .slice(0, 10);
    for (var i = 0; i < get_one_data.length; i++) {
      let D1 = new Date(get_one_data[i].applicableDate)
        .toISOString()
        .slice(0, 10);
      let D2;
      if (get_one_data[i].endDate == null) {
        D2 = null;
      } else {
        D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
      }

      let D3 = new Date().toISOString().slice(0, 10);
      if (D3 >= D1 && D3 <= D2) {
        get_one_data[i].dataValues.branchstatus = 'active';
      } else if (D2 == null && D1 <= D3) {
        get_one_data[i].dataValues.branchstatus = 'active';
      } else if (D3 > D1) {
        if (D1 == past) {
          get_one_data[i].dataValues.branchstatus = 'active';
        } else {
          get_one_data[i].dataValues.branchstatus = 'deactive';
        }
      } else if (D3 == D1) {
        get_one_data[i].dataValues.branchstatus = 'active';
      } else {
        get_one_data[i].dataValues.branchstatus = 'deactive';
      }
    }
  }
  return get_one_data;
}

async function employeedepartment(userid) {
  let get_one_data = await EmployeeDepartment.findAll({
    where: {
      userMasterID: userid,
      status: 1,
    },
    order: [['applicableDate', 'ASC']],
    include: [{ all: true }],
  }); // Find User Shift

  // Date Wise Active Deactive
  if (get_one_data.length == 1) {
    if (
      new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
      new Date().toISOString().slice(0, 10)
    ) {
      get_one_data[0].dataValues.departmentstatus = 'deactive';
    } else {
      get_one_data[0].dataValues.departmentstatus = 'active';
    }
  } else if (get_one_data.length == 0) {
  } else {
    let startdates = [];
    for (var j = 0; j < get_one_data.length; j++) {
      startdates.push(new Date(get_one_data[j].applicableDate));
    }
    const dateArr = startdates.sort((a, b) => a - b);
    const nearestPastDate = (dateArr, date) => {
      const pastArr = dateArr.filter((n) => n <= date);
      return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
    };
    const past = nearestPastDate(dateArr, new Date())
      .toISOString()
      .slice(0, 10);
    for (var i = 0; i < get_one_data.length; i++) {
      let D1 = new Date(get_one_data[i].applicableDate)
        .toISOString()
        .slice(0, 10);
      let D2;
      if (get_one_data[i].endDate == null) {
        D2 = null;
      } else {
        D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
      }

      let D3 = new Date().toISOString().slice(0, 10);
      if (D3 >= D1 && D3 <= D2) {
        get_one_data[i].dataValues.departmentstatus = 'active';
      } else if (D2 == null && D1 <= D3) {
        get_one_data[i].dataValues.departmentstatus = 'active';
      } else if (D3 > D1) {
        if (D1 == past) {
          get_one_data[i].dataValues.departmentstatus = 'active';
        } else {
          get_one_data[i].dataValues.departmentstatus = 'deactive';
        }
      } else if (D3 == D1) {
        get_one_data[i].dataValues.departmentstatus = 'active';
      } else {
        get_one_data[i].dataValues.departmentstatus = 'deactive';
      }
    }
  }
  return get_one_data;
}
async function employeedesignation(userid) {
  let get_one_data = await EmployeeDesignation.findAll({
    where: {
      userMasterID: userid,
      status: 1,
    },
    order: [['applicableDate', 'ASC']],
    include: [{ all: true }],
  }); // Find User Shift

  // Date Wise Active Deactive
  if (get_one_data.length == 1) {
    if (
      new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
      new Date().toISOString().slice(0, 10)
    ) {
      get_one_data[0].dataValues.designationstatus = 'deactive';
    } else {
      get_one_data[0].dataValues.designationstatus = 'active';
    }
  } else if (get_one_data.length == 0) {
  } else {
    let startdates = [];
    for (var j = 0; j < get_one_data.length; j++) {
      startdates.push(new Date(get_one_data[j].applicableDate));
    }
    const dateArr = startdates.sort((a, b) => a - b);
    const nearestPastDate = (dateArr, date) => {
      const pastArr = dateArr.filter((n) => n <= date);
      return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
    };
    const past = nearestPastDate(dateArr, new Date())
      .toISOString()
      .slice(0, 10);
    for (var i = 0; i < get_one_data.length; i++) {
      let D1 = new Date(get_one_data[i].applicableDate)
        .toISOString()
        .slice(0, 10);
      let D2;
      if (get_one_data[i].endDate == null) {
        D2 = null;
      } else {
        D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
      }

      let D3 = new Date().toISOString().slice(0, 10);
      if (D3 >= D1 && D3 <= D2) {
        get_one_data[i].dataValues.designationstatus = 'active';
      } else if (D2 == null && D1 <= D3) {
        get_one_data[i].dataValues.designationstatus = 'active';
      } else if (D3 > D1) {
        if (D1 == past) {
          get_one_data[i].dataValues.designationstatus = 'active';
        } else {
          get_one_data[i].dataValues.designationstatus = 'deactive';
        }
      } else if (D3 == D1) {
        get_one_data[i].dataValues.designationstatus = 'active';
      } else {
        get_one_data[i].dataValues.designationstatus = 'deactive';
      }
    }
  }
  return get_one_data;
}

exports.getsalaryslipuserwise = async (req, res, next) => {
  try {
    let result = await sequelize.transaction(async (t) => {
      let slipdata = await executeQuery(
        'select * from public.ms_fun_salaryslip_data_userwise(' +
          req.body.companyid +
          ',' +
          req.body.userid +
          ',' +
          req.body.yearmonth +
          ')'
      );
      let leavedata = await executeQuery(
        'select *from public.ms_fun_gethrleavemonthlytrans(' +
          req.body.companyid +
          ', ' +
          req.body.yearmonth +
          ', ' +
          req.body.userid +
          ')'
      );

      let employeebranchs = await employeebranch(req.body.userid);
      let employeedepartments = await employeedepartment(req.body.userid);
      let employeedesignations = await employeedesignation(req.body.userid);

      let branch;
      if (employeebranchs.length > 0) {
        let activeshift = [];
        for (var n = 0; n < employeebranchs.length; n++) {
          activeshift.push(employeebranchs[n].dataValues);
        }
        branch = activeshift.filter((word) => word.branchstatus == 'active');
        if (branch.length > 0) {
          branch = branch[0].branchMaster;
        }
      }

      let department;

      if (employeedepartments.length > 0) {
        let activedepartment = [];
        for (var n = 0; n < employeedepartments.length; n++) {
          activedepartment.push(employeedepartments[n].dataValues);
        }
        department = activedepartment.filter(
          (word) => word.departmentstatus == 'active'
        );
        if (department.length > 0) {
          department = department[0];
        }
      }

      let assigndepartment;
      if (department) {
        assigndepartment = department;
      } else {
        assigndepartment = '';
      }
      //Designation
      let designation;

      if (employeedesignations.length > 0) {
        let activedesignation = [];
        for (var n = 0; n < employeedesignations.length; n++) {
          activedesignation.push(employeedesignations[n].dataValues);
        }
        designation = activedesignation.filter(
          (word) => word.designationstatus == 'active'
        );
        if (designation.length > 0) {
          designation = designation[0];
        }
      }

      let assigndesignation;
      if (designation) {
        assigndesignation = designation;
      } else {
        assigndesignation = '';
      }

      if (branch) {
        branch = branch;
      } else {
        branch = '';
      }
      if (designation) {
        designation = designation;
      } else {
        designation = '';
      }
      if (department) {
        department = department;
      } else {
        department = '';
      }

      let data3 = { branch, department, designation };

      res.status(200).json({
        status: 200,
        message: 'Data get Successfully.',
        data: slipdata,
        data2: leavedata,
        data3: data3,
      });
      return slipdata;
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserWiseSalarySlip = async (req, res, next) => {
  try {
    let slip;

    if (req.body.status) {
      if (req.body.status == '01') {
        slip = await HrSalarySlip.findOne({
          where: {
            userMasterID: req.body.userMasterID,
            salaryYYYYMM: req.body.yyyymm,
            // salarySlipIssue:1
          },
        });
      }
    } else {
      slip = await HrSalarySlip.findOne({
        where: {
          userMasterID: req.body.userMasterID,
          salaryYYYYMM: req.body.yyyymm,
          salarySlipIssue: 1,
        },
      });
    }

    res.status(200).json({
      status: 200,
      message: 'Salary Slip Get Successfully.',
      data: slip,
    });
  } catch (err) {
    next(err);
  }
};

exports.ctcmasterreport = async (req, res, next) => {
  const _ = require('lodash');
  try {
    const {
      userMasterID,
      companyMasterID,
      yearmonth,
      limit,
      page,
      exportData,
      exportPdf,
    } = req.body;

    const user = userMasterID,
      companyID = companyMasterID;
    let offset = (page - 1) * limit;

    const MainData = [];
    for (const userId of user) {
      let employeejoining = await EmployeeJoiningDetails.findOne({
        where: {
          userMasterID: userId,
        },
      });

      if (employeejoining) {
        let joingdate =
          employeejoining.joiningDate.toString().slice(0, 4) +
          employeejoining.joiningDate.toString().slice(5, 7);
        if (joingdate <= yearmonth) {
          const resultsSalary = await executeQuery(`
          SELECT MAX("salaryFromYYYYMM") FROM "hrSalaryMasters"
          WHERE "userMasterID"=${userId} AND "salaryFromYYYYMM"<=${yearmonth}
        `);

          const YYYYMM = resultsSalary[0].max;
          const EJD = await executeQuery(`
          SELECT "employeeCode", "joiningDate" FROM "employeeJoiningDetails"
          WHERE "userMasterID"=${userId}
        `);

          let AllField = {};
          AllField['EmployeeCode'] = EJD[0].employeeCode;

          const UM = await executeQuery(`
          SELECT "displayName", "userNumber" FROM "userMasters"
          WHERE "userMasterID"=${userId}
        `);

          AllField['Name'] = UM[0].displayName;
          AllField['Mobile No'] = UM[0].userNumber;

          const BDD = await findBranchDepartDesig(new Date(), userId);

          AllField['Branch'] = BDD.branch;
          AllField['Department'] = BDD.depart;
          AllField['Designation'] = BDD.desig;

          const results = await executeQuery(
            `
          SELECT A.*, COALESCE(B.actualamount, 0) as amount FROM (
            SELECT PHM."payheadName",HSF."payheadDisplayName", HSF."payheadMasterId", HSF."salaryFieldSrNo",
              HSF."salaryFieldSide", HSF."salaryFieldShow"
            FROM "hrSalaryFields" as HSF
            INNER JOIN "Payheadmasters" as PHM ON HSF."payheadMasterId" = PHM."payheadMasterId"
            WHERE HSF."companyMasterID"=` +
              companyID +
              ` AND HSF.status=1
              AND HSF."payheadMasterId" NOT IN (1, 50)
              AND HSF."salaryFieldSrNo" NOT IN ('D')
            ORDER BY HSF."salaryFieldID" ASC
          ) as A
          LEFT OUTER JOIN (
            SELECT HSF."payheadMasterId" as payheadid, HSM."EmployeeSalaryAmount" as actualamount
            FROM "hrSalaryMasters" as HSM
            INNER JOIN "gradeSalaryStructures" as GSS ON HSM."gradeSalaryStructureID" = GSS."gradeSalaryStructureID"
            LEFT OUTER JOIN "gradeStructures" as GS ON GSS."gradeStructureID" = GS."gradeStructureID"
            INNER JOIN "hrSalaryFields" as HSF ON GSS."salaryFieldID" = HSF."salaryFieldID"
            INNER JOIN "Payheadmasters" as PHM ON HSF."payheadMasterId" = PHM."payheadMasterId"
            WHERE HSM."userMasterID"=${userId} AND HSM."salaryFromYYYYMM"=${YYYYMM} ORDER BY HSF."salaryFieldID" ASC 
          ) as B ON A."payheadMasterId" = B.payheadid`
          );

          let A_Income = [];
          let B_Deduction = [];
          let C_Deduction = [];

          results.forEach((Obj) => {
            if (Obj.salaryFieldSrNo == 'A') {
              A_Income.push(Obj.amount);
            }
            if (Obj.salaryFieldSrNo == 'B') {
              B_Deduction.push(Obj.amount);
            }
            if (Obj.salaryFieldSrNo == 'C') {
              C_Deduction.push(Obj.amount);
            }
          });

          let Gross_Income = _.sum(A_Income);
          let Gross_Deduction = _.sum(B_Deduction);
          let NetPay = _.sum(A_Income) - _.sum(B_Deduction);
          let CTC = _.sum(A_Income) + _.sum(C_Deduction);

          results.forEach((Obj) => {
            if (Obj.salaryFieldSrNo == 'A') {
              AllField[
                Obj.payheadDisplayName && Obj.payheadDisplayName.trim()
                  ? Obj.payheadDisplayName
                  : Obj.payheadName
              ] = Obj.amount;
            }
          });

          AllField['Gross_Income'] = Gross_Income;

          results.forEach((Obj) => {
            if (Obj.salaryFieldSrNo == 'B') {
              AllField[
                Obj.payheadDisplayName && Obj.payheadDisplayName.trim()
                  ? Obj.payheadDisplayName
                  : Obj.payheadName
              ] = Obj.amount;
            }
          });

          AllField['Gross_Deduction'] = Gross_Deduction;
          AllField['NetPay'] = NetPay;

          results.forEach((Obj) => {
            if (Obj.salaryFieldSrNo == 'C') {
              AllField[
                Obj.payheadDisplayName && Obj.payheadDisplayName.trim()
                  ? Obj.payheadDisplayName
                  : Obj.payheadName
              ] = Obj.amount;
            }
          });

          AllField['CTC'] = CTC;

          MainData.push(AllField);
        }
      }
    }

    if (exportData) {
      await generateExcel(MainData, 'CTC Master Report', 'xlsx', res);
      return;
    }

    if (exportPdf) {
      const companyDetails = await companyMaster.findOne({
        where: { companyMasterID: companyID },
        raw: true,
      });

      const { companyName, companyAddress, companyLogo } = companyDetails;

      const headers = Object.keys(MainData[0]);

      const pdfData = {
        datalength: headers.length,
        companyName,
        companyAddress,
        companyLogo,
        headers,
        MainData,
        ApiURL: mainApiUrl,
      };

      const getTemplate1 = (type) => {
        const file = path.join(__dirname, `../html/${type}.html`);
        return file;
      };

      Handlebars.registerHelper({
        eq: (v1, v2) => v1 === v2,
        ne: (v1, v2) => v1 !== v2,
        lt: (v1, v2) => v1 < v2,
        gt: (v1, v2) => v1 > v2,
        lte: (v1, v2) => v1 <= v2,
        gte: (v1, v2) => v1 >= v2,
        and() {
          return Array.prototype.every.call(arguments, Boolean);
        },
        or() {
          return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        },
      });

      const readFile = (name) => {
        return new Promise((resolve, reject) => {
          fs.readFile(name, 'utf-8', (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      };

      const filePath = await getTemplate1('ctcMasterReport');

      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      const html = template(pdfData);

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();

      // Set the HTML content of the page
      await page.setContent(html);

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4', // Page format (A4 in this case)
        printBackground: true, // print background
        landscape: true,
        timeout: 120000,
      });
      await browser.close();

      let base64path = Buffer.from(pdfBuffer).toString('base64');

      return res.status(200).json({
        status: 200,
        data: base64path,
      });
    }

    res.status(200).json({
      status: 200,
      data: MainData,
      totalcount: MainData.length,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.monthlyhrsalaryregister = async (req, res, next) => {
  try {
    let = {
      companyMasterID,
      YearMM,
      limit,
      page,
      searchQuery,
      department,
      designation,
    } = req.body;
    if (department.length > 0 && designation.length > 0) {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran(` +
          companyMasterID +
          `,` +
          YearMM +
          `) WHERE departmentid IN (` +
          department.join(',') +
          `) AND designationid IN (` +
          designation.join(',') +
          `)`
      );
    } else if (department.length > 0 && designation.length <= 0) {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran(` +
          companyMasterID +
          `,` +
          YearMM +
          `)  WHERE departmentid IN (` +
          department.join(',') +
          ` )`
      );
    } else if (department.length <= 0 && designation.length > 0) {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran(` +
          companyMasterID +
          `,` +
          YearMM +
          `)  WHERE designationid IN (` +
          designation.join(',') +
          `)`
      );
    } else {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran(` +
          companyMasterID +
          `,` +
          YearMM +
          `)`
      );
    }
    //  results=await sequelize.query(`select * from public.ms_fun_GethrSalaryCalculation(`+companyMasterID+`,`+YearMM+`) limit1 `+limit1+` OFFSET `+offset)
    var finalresp = [];
    if (results != undefined && results.length != 0) {
      results.sort(
        (a, b) => parseInt(a.usermasterid) - parseInt(b.usermasterid)
      );
      var unique = [],
        uid;

      results.forEach((element) => {
        if (uid != element.usermasterid) {
          unique.push(element);
          uid = element.usermasterid;
        }
      });

      unique.forEach((element) => {
        let empdata = results.filter(
          (r1) => r1.usermasterid == element.usermasterid
        );
        empdata.sort((e1, e2) => e1.vn_sort_index - e2.sort_index);
        if (empdata.length != 0) {
          let leavename = [];
          empdata.forEach((element) => {
            let arr = [];
            for (var key in element) {
              if (element.salaryfieldshow == 'Y') {
                if (key == 'payheadname') {
                  arr.push(element[key]);
                }
                if (key == 'salarymasteramount') {
                  arr.push(element[key]);
                }
                if (key == 'vv_field_side') {
                  arr.push(element[key]);
                }
                if (arr.length == 3) {
                  leavename.push({
                    ltype: arr[2],
                    bal: arr[0],
                    side: arr[1],
                  });
                  arr = [];
                }
              }
            }
          });
          var newJson = {
            EmployeeName: empdata[0].employeename,
            Gender: empdata[0].gender,
            DateOfBirth: empdata[0].dob,
            Department: empdata[0].departmentname,
            Designation: empdata[0].designationname,
            JoiningDate: empdata[0].joiningdate,
            GrossIncome: 0,
            GrossDeduction: 0,
            NetSalary: 0,
          };
          let earning = 0;
          let deduction = 0;
          let net = 0;
          leavename.forEach((el, ind) => {
            el.val = el.bal;
            let key = el.ltype;
            newJson[key] = el.val;

            if (el.side == 'E') {
              earning = earning + el.val;
            } else {
              deduction = deduction + el.val;
            }
            net = earning - deduction;
            (newJson['GrossIncome'] = earning),
              (newJson['GrossDeduction'] = deduction),
              (newJson['NetSalary'] = net);
          });

          finalresp.push(newJson);
        }
      });
    } else {
    }

    res
      .status(200)
      .json({ status: 200, data: finalresp, totalcount: finalresp.length });
  } catch (err) {
    next(err.message);
  }
};

exports.salarysummaryreport = async (req, res, next) => {
  try {
    let = {
      companyMasterID,
      YearMM,
      limit,
      page,
      searchQuery,
      department,
      designation,
    } = req.body;
    if (department.length > 0 && designation.length > 0) {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran_summary(` +
          companyMasterID +
          `,` +
          YearMM +
          `) WHERE departmentid IN (` +
          department.join(',') +
          `) AND designationid IN (` +
          designation.join(',') +
          `)`
      );
    } else if (department.length > 0 && designation.length <= 0) {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran_summary(` +
          companyMasterID +
          `,` +
          YearMM +
          `)  WHERE departmentid IN (` +
          department.join(',') +
          ` )`
      );
    } else if (department.length <= 0 && designation.length > 0) {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran_summary(` +
          companyMasterID +
          `,` +
          YearMM +
          `)  WHERE designationid IN (` +
          designation.join(',') +
          `)`
      );
    } else {
      results = await executeQuery(
        `select * from public.ms_fun_rpt_hr_salary_tran_summary(` +
          companyMasterID +
          `,` +
          YearMM +
          `)`
      );
    }

    let finalresp = [];
    results.forEach((element) => {
      finalresp.push({
        EmployeeName: element.employeename,
        Department: element.departmentname,
        Designation: element.designationname,
        GrossIncome: element.grosssal,
        GrossDeduction: element.totaldedn,
        NetSalary: element.netsal,
      });
    });
    res
      .status(200)
      .json({ status: 200, data: finalresp, totalcount: finalresp.length });
  } catch (err) {
    next(err.message);
  }
};

// for Adding overtime,tds,incentive,penalty,Attendance Penalty etc.

exports.addingOtherFieldsInGrade = async (req, res, next) => {
  try {
    let { gradeStructureID, companyMasterID } = await req.body;
    let transaction = await sequelize.transaction(async (t) => {
      const payheadData = await HRSalaryFields.findAll({
        where: {
          payheadMasterId: {
            [Sequelize.Op.in]: [
              9, 16, 17, 43, 24, 34, 78, 83, 96, 97, 99, 67, 101,
            ],
          },
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      for (let i = 0; i < payheadData.length; i++) {
        const findData = await GradeSalaryStructure.findOne({
          where: {
            gradeStructureID: gradeStructureID,
            salaryFieldID: payheadData[i].salaryFieldID,
          },
        });

        if (!findData) {
          let addData = await GradeSalaryStructure.create(
            {
              gradeStructureID: gradeStructureID,
              salaryFieldID: payheadData[i].salaryFieldID,

              fieldFixAmount: 0,
              createBy: 4,
              createByIp: '192.11',
            },
            { transaction: t }
          );
        }
      }
    });

    // add user wise fields

    const gradeData = await GradeSalaryStructure.findAll({
      where: {
        gradeStructureID: gradeStructureID,
      },
      include: [
        {
          model: HRSalaryFields,
          where: {
            payheadMasterId: {
              [Sequelize.Op.in]: [
                9, 16, 17, 43, 24, 34, 78, 83, 96, 97, 99, 67, 101,
              ],
            },
          },
        },
      ],
    });

    // find user

    const userData = await executeQuery(
      `
              select "userMasterID","salaryFromYYYYMM","ptaxinctc",stateid,"AmountIn" from "hrSalaryMasters" as hsm INNER join "gradeSalaryStructures" as gss on hsm."gradeSalaryStructureID" = gss."gradeSalaryStructureID"  where gss."gradeStructureID"=` +
        gradeStructureID +
        ` GROUP BY "userMasterID",hsm."salaryFromYYYYMM","ptaxinctc",stateid,"AmountIn"`
    );

    let transaction1 = await sequelize.transaction(async (t) => {
      for (let j = 0; j < userData.length; j++) {
        for (let k = 0; k < gradeData.length; k++) {
          const data = await HRSalaryMaster.findOne({
            where: {
              userMasterID: userData[j].userMasterID,
              gradeSalaryStructureID: gradeData[k].gradeSalaryStructureID,
            },
          });

          if (!data) {
            let addData = await HRSalaryMaster.create(
              {
                userMasterID: userData[j].userMasterID,
                gradeSalaryStructureID: gradeData[k].gradeSalaryStructureID,
                EmployeeSalaryAmount: 0,
                ActualEmployeeSalaryAmount: 0,
                salaryFromYYYYMM: userData[j].salaryFromYYYYMM,
                ptaxinctc: userData[j].ptaxinctc,
                stateid: userData[j].stateid || 0,
                AmountIn: userData[j].AmountIn,
                createBy: '4',
                createByIp: '192.11',
              },
              { transaction: t }
            );
          }
        }
      }
    });

    res.status(200).json({
      status: 200,
      message: 'Data Updated Successfully.',
    });
  } catch (err) {
    next(err.message);
  }
};

exports.issueSalarySlip = async (req, res, next) => {
  try {
    let { userMasterID, salaryYYYYMM, salarySlipIssue, updateBy, updateByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      for (let i = 0; i < userMasterID.length; i++) {
        await HrSalarySlip.update(
          {
            salarySlipIssue: salarySlipIssue,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              userMasterID: userMasterID[i],
              salaryYYYYMM: salaryYYYYMM,
            },
            transaction: t,
          }
        );
      }

      res.status(200).json({
        status: 200,
        message: 'SalarySlip Issue Successfully.',
      });
    });
  } catch (error) {
    next(err.message);
  }
};

exports.getVariableDemoExcel = async (req, res, next) => {
  try {
    const { companyMasterID, fileName } = req.query;

    const date =
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2);

    const users = await EmployeeJoiningDetails.findAndCountAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: date,
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: date },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: date },
              },
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
              },
            ],
          },
        ],
        '$userMaster.companyMasterId$': companyMasterID,
        '$userMaster.status$': [0, 1],
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });
    // const users = await getAllUserByCompanyDateWise(companyMasterID, '', '', date);

    let header = [];

    if (fileName == 'incentive') {
      const incentiveTypes = await Incentivetype.findAll({
        raw: true,
        where: Sequelize.and(
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('incentivetypename'))
            ),
            {
              [Sequelize.Op.notIn]: nonEditableList_INC,
            }
          ),
          Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        attributes: ['incentivetypename'],
      });

      header = incentiveTypes.map((e) => e.incentivetypename);
    } else {
      const penaltyTypes = await Penalty.findAll({
        raw: true,
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
        attributes: ['penaltyName'],
      });

      header = penaltyTypes.map((e) => e.penaltyName);
    }

    const final = await Promise.all(
      users.rows.map(async (e) => {
        const department = await employeeDepartment(e.userMasterID, date);
        const branch = await employeeBranch(e.userMasterID, date);

        return {
          'Employee Code': e.employeeCode,
          'Employee Name': e['userMaster.displayName'],
          'Mobile No.': e['userMaster.userNumber'],
          Branch: branch ? branch['branchMaster.branchName'] : '',
          Department: department ? department['department.departmentName'] : '',
        };
      })
    );

    final.sort((a, b) => a['Employee Name'].localeCompare(b['Employee Name']));

    if (+final.length === 0) {
      return res.status(200).json({
        message: 'No data found to export!',
      });
    }
    await generateDemoExcelForVariable(
      header,
      final,
      `${fileName}`,
      'xlsx',
      res
    );

    return;
  } catch (err) {
    next(err);
  }
};

const readXlsxFile = require('read-excel-file/node');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const companyMaster = require('../models/companyMaster');
const GradeStructure = require('../models/gradeStructure');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const advancePayment = require('../models/advancePayment');
const overTimeCalculationMain = require('../models/overTimeCalculationMain');
const { error, count } = require('console');
const deposit = require('../models/deposit');
const depositcategory = require('../models/depositCategory');
const Contractor = require('../models/contractor');
const CityMaster = require('../models/citymaster');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const BankMaster = require('../models/bankMaster');
const e = require('express');
const empLeavePolicy = require('../models/empLeavePolicy');
const {
  nonEditableList_INC,
  bonusCreditTypeEnum,
  yearCycleEnum,
  bonusCreditCycleEnum,
  PenaltyDeductFromEnum,
  LCEGPenaltyTypeEnum,
} = require('../utils/dbUtils');
const employeeLeavePolicy = require('../models/employeeLeavePolicy');
const LeaveEncashment = require('../models/leaveEncashment');
const EmployeeRepayment = require('../models/employeeRepayment');
const EmployeeBonusPolicy = require('../models/employeeBonusPolicy');
const BonusPolicy = require('../models/bonusPolicy');
const LCEGPenalty = require('../models/lcegPenalty');

exports.uploadVariablePayheadExcel = async (req, res, next) => {
  try {
    const { companyMasterID, month, fileName, createByIP } = await req.body;

    const createBy = req.userDetails.userMasterId;

    const convertExcelDateToISO = (excelDate) => {
      return new Date(Math.round(excelDate - 25569) * 86400 * 1000)
        .toISOString()
        .slice(0, 10);
    };

    const formatDateStringToISO = (dateString) => {
      return new Date(dateString).toISOString().slice(0, 10);
    };

    const lastDateOfMonth =
      month.slice(0, 4) +
      '-' +
      month.slice(4, 6) +
      '-' +
      daysInMonth(month.slice(4, 6), month.slice(0, 4));

    const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

    readXlsxFile(filePath).then(async (rows) => {
      const headerPart = rows[0].slice(6);

      const datarows = rows.slice(1);

      const finaldata = [];

      if (fileName == 'incentive') {
        const incentiveTypeArray = [];

        const withOutAttnBonusHeader = headerPart.filter(
          (e) => !nonEditableList_INC.includes(String(e).toLowerCase().trim())
        );

        await sequelize
          .transaction(async (t) => {
            for (const header of withOutAttnBonusHeader) {
              const incentiveType = await Incentivetype.findOne({
                raw: true,
                attributes: [
                  'incentivetypename',
                  'companyMasterID',
                  'IncentivetypeID',
                ],
                where: Sequelize.and(
                  Sequelize.where(
                    sequelize.fn(
                      'TRIM',
                      sequelize.fn('LOWER', sequelize.col('incentivetypename'))
                    ),
                    header.trim().toLowerCase()
                  ),
                  Sequelize.where(
                    sequelize.col('companyMasterID'),
                    companyMasterID
                  ),
                  Sequelize.where(sequelize.col('status'), 1)
                ),
              });

              incentiveTypeArray.push(incentiveType);
            }

            for (const row of datarows) {
              const userMaster = await UserMaster.findOne({
                raw: true,
                where: {
                  userNumber: String(row[2]),
                  companyMasterId: companyMasterID,
                  status: 1,
                },
              });

              if (userMaster) {
                for (const [index, value] of incentiveTypeArray.entries()) {
                  if (
                    row[6 + index] != null &&
                    row[6 + index] > 0 &&
                    typeof row[6 + index] === 'number'
                  ) {
                    if (!row[5])
                      return res.status(200).send({
                        status: 402,
                        message: `Incentive Date is required of: ${row[2]}`,
                      });

                    const salary = await HrSalaryTrans.findOne({
                      where: {
                        userMasterID: userMaster.userMasterID,
                        salaryYYYYMM: +month,
                      },
                    });

                    if (salary) {
                      return res.status(200).json({
                        status: 401,
                        message:
                          'Salary already calculated for ' +
                          `'${userMaster.userNumber}'`,
                      });
                    }

                    let date = '';

                    if (typeof row[5] === 'number') {
                      date = convertExcelDateToISO(row[5]);
                    } else if (isValidDate(row[5])) {
                      date = formatDateStringToISO(row[5]);
                    } else {
                      return res.status(200).send({
                        status: 402,
                        message: `Incentive Date Should be in 'yyyy-mm-dd' Format of: ${row[2]}`,
                      });
                    }

                    if (date.slice(0, 4) + date.slice(5, 7) != month)
                      return res.status(200).send({
                        status: 402,
                        message: `Incentive Date is not range of this month of: ${row[2]}`,
                      });

                    const incentiveData = await Employeeincentive.findOne({
                      raw: true,
                      where: {
                        userMasterID: userMaster.userMasterID,
                        yearmonth: +month,
                        IncentivetypeID: +value.IncentivetypeID,
                        incentiveDate: date,
                        status: 1,
                      },
                    });

                    if (incentiveData) {
                      await Employeeincentive.update(
                        {
                          amount: +row[6 + index],
                          updateBy: +createBy,
                          updateByIp: createByIP,
                        },
                        {
                          where: {
                            employeeincentiveID:
                              incentiveData.employeeincentiveID,
                          },
                          transaction: t,
                        }
                      );
                    } else {
                      finaldata.push({
                        userMasterID: userMaster.userMasterID,
                        yearmonth: +month,
                        amount: +row[6 + index],
                        IncentivetypeID: +value.IncentivetypeID,
                        incentiveDate: date,
                        status: 1,
                        createBy: +createBy,
                        createByIp: createByIP,
                      });
                    }
                  }
                }
              }
            }

            await Employeeincentive.bulkCreate(finaldata, { transaction: t });

            fs.unlink(filePath, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log('delete');
              }
            });

            return res.status(200).send({
              status: 200,
              message:
                ' The File Upload Successfully: ' + req.file.originalname,
            });
          })
          .catch((err) => {
            res.status(200).send({
              status: 401,
              message: 'Fail to import data into database!' + err.message,
              error: err.message,
            });
          });
      }

      if (fileName == 'penalty') {
        const penaltyTypeArray = [];

        await sequelize
          .transaction(async (t) => {
            for (const header of headerPart) {
              const penaltytype = await Penalty.findOne({
                raw: true,
                attributes: ['penaltyID', 'penaltyName'],
                where: Sequelize.and(
                  Sequelize.where(
                    sequelize.fn(
                      'TRIM',
                      sequelize.fn('LOWER', sequelize.col('penaltyName'))
                    ),
                    header.trim().toLowerCase()
                  ),
                  Sequelize.where(
                    sequelize.col('companyMasterID'),
                    companyMasterID
                  ),
                  Sequelize.where(sequelize.col('status'), 1)
                ),
              });

              penaltyTypeArray.push(penaltytype);
            }

            for (const row of datarows) {
              const userMaster = await UserMaster.findOne({
                raw: true,
                where: {
                  userNumber: String(row[2]),
                  companyMasterId: companyMasterID,
                  status: 1,
                },
              });

              if (userMaster) {
                for (const [index, value] of penaltyTypeArray.entries()) {
                  if (
                    row[6 + index] != null &&
                    row[6 + index] > 0 &&
                    typeof row[6 + index] === 'number'
                  ) {
                    if (!row[5])
                      return res.status(200).send({
                        status: 402,
                        message: `Penalty Date is required of: ${row[2]}`,
                      });

                    const salary = await HrSalaryTrans.findOne({
                      where: {
                        userMasterID: userMaster.userMasterID,
                        salaryYYYYMM: +month,
                      },
                    });
                    if (salary) {
                      return res.status(200).json({
                        status: 401,
                        message:
                          'Salary already calculated for ' +
                          `'${userMaster.userNumber}'`,
                      });
                    }

                    let date = '';

                    if (typeof row[5] === 'number') {
                      date = convertExcelDateToISO(row[5]);
                    } else if (isValidDate(row[5])) {
                      date = formatDateStringToISO(row[5]);
                    } else {
                      return res.status(200).send({
                        status: 402,
                        message: `Penalty Date Should be in 'yyyy-mm-dd' Format of: ${row[2]}`,
                      });
                    }

                    if (date.slice(0, 4) + '' + date.slice(5, 7) != month)
                      return res.status(200).send({
                        status: 402,
                        message: `Penalty Date is not range of this month of: ${row[2]}`,
                      });

                    const penaltyData = await EmployeePenalty.findOne({
                      raw: true,
                      where: {
                        userMasterID: userMaster.userMasterID,
                        penaltyID: +value.penaltyID,
                        penaltyDate: date,
                        status: 1,
                      },
                    });

                    if (penaltyData) {
                      await EmployeePenalty.update(
                        {
                          penaltyAmount: +row[6 + index],
                          updateBy: +createBy,
                          updateByIp: createByIP,
                        },
                        {
                          where: {
                            employeePenaltyID: penaltyData.employeePenaltyID,
                          },
                          transaction: t,
                        }
                      );
                    } else {
                      finaldata.push({
                        userMasterID: userMaster.userMasterID,
                        penaltyID: +value.penaltyID,
                        penaltyDate: date ? date : lastDateOfMonth,
                        penaltyAmount: +row[6 + index],
                        description: '',
                        status: 1,
                        createBy: +createBy,
                        createByIp: createByIP,
                      });
                    }
                  }
                }
              }
            }

            await EmployeePenalty.bulkCreate(finaldata, { transaction: t });

            fs.unlink(filePath, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log('delete');
              }
            });

            return res.status(200).send({
              status: 200,
              message:
                ' The File Upload Successfully: ' + req.file.originalname,
            });
          })
          .catch((err) => {
            res.status(200).send({
              status: 401,
              message: 'Fail to import data into database!' + err.message,
              error: err.message,
            });
          });
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.sendSalarySlipviamail = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchMasterID,
      userMasterID,
      month,
      page,
      limit,
    } = req.body;
    if (!companyMasterID || !month) {
      return res.status(200).json({
        status: 401,
        message: 'Company and Month are require fields!',
      });
    }
    const fromMail = await findCompanyNotificationPolicy(+companyMasterID);

    if (!fromMail)
      return res.status(200).json({
        status: 401,
        message: 'Notification Policy does not exist!',
      });

    const startDate =
      month.toString().slice(0, 4) +
      '-' +
      month.toString().slice(4, 6) +
      '-' +
      '01';
    const endDate =
      month.toString().slice(0, 4) +
      '-' +
      month.toString().slice(4, 6) +
      '-' +
      daysInMonth(month.slice(4, 6), month.slice(0, 4));

    let userdata = [];
    let userids = [];

    if (companyMasterID && !branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const paginateCondition = {};
      // if (page && limit && Export != 'true') {
      //   paginateCondition.offset = (page - 1) * limit;
      //   paginateCondition.limit = limit;
      // }

      const userdata1 = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': [0, 1],
        },
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // const userdata1 = await getUserByCompanyandDateRange(
      //   companyMasterID,
      //   '',
      //   '',
      //   startDate,
      //   endDate
      // );

      userdata = userdata1.rows;
    }

    if (branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(startdate),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }
      const paginateCondition = {};
      if (page && limit) {
        paginateCondition.offset = (page - 1) * limit;
        paginateCondition.limit = limit;
      }

      const userdata1 = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          userMasterID: allActiveUsersID,
          '$userMaster.status$': [0, 1],
        },
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      userdata1.rows.forEach((row) => {
        const branchData = get_branch_users.rows.find(
          (user) => user.userMasterID === row.userMasterID
        );
        if (branchData) {
          row.branchStartDate = branchData.applicableDate;
          row.branchEndDate = branchData.endDate;
        }
      });
      // const userdata1 = await getUserByBranchandDateRange(
      //   branchMasterID,
      //   '',
      //   '',
      //   startDate,
      //   endDate
      // );

      userdata = userdata1.rows;
    }

    userdata.map((e) => {
      userids.push(e.userMasterID);
    });

    if (userMasterID) userids = userMasterID;

    const AllsalarySlips = await HrSalarySlip.findAll({
      raw: true,
      where: {
        salaryYYYYMM: month,
        userMasterID: userids,
        '$userMaster.email$': {
          [Sequelize.Op.not]: null,
        },
      },
      include: [{ model: UserMaster, attributes: [] }],
      attributes: [
        [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
        'path',
        [Sequelize.col('userMaster.email'), 'email'],
      ],
    });

    await EmailSalarySlip(AllsalarySlips, fromMail, month);

    return res.status(200).json({
      status: 200,
      message: 'Mail Sent Successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllSalarySlip = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, yearMonth, page, limit } =
      req.query;
    if (!companyMasterID || !yearMonth)
      return res.status(200).json({
        status: 401,
        message: 'companyMasterID and yearMonth are required fields.',
      });

    const startDate =
      yearMonth.slice(0, 4) + '-' + yearMonth.slice(4, 6) + '-' + '01';
    const endDate =
      yearMonth.slice(0, 4) +
      '-' +
      yearMonth.slice(4, 6) +
      '-' +
      daysInMonth(yearMonth.slice(4, 6), yearMonth.slice(0, 4));

    let userIds = [];

    if (companyMasterID && branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(startdate),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }
      const paginateCondition = {};
      if (page && limit) {
        paginateCondition.offset = (page - 1) * limit;
        paginateCondition.limit = limit;
      }

      const userdata = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          userMasterID: allActiveUsersID,
          '$userMaster.status$': [0, 1],
        },
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      userdata.rows.forEach((row) => {
        const branchData = get_branch_users.rows.find(
          (user) => user.userMasterID === row.userMasterID
        );
        if (branchData) {
          row.branchStartDate = branchData.applicableDate;
          row.branchEndDate = branchData.endDate;
        }
      });
      // const userdata = await getUserByBranchandDateRange(
      //   branchMasterID,
      //   '',
      //   '',
      //   startDate,
      //   endDate
      // );
      userIds = userdata.rows.map((e) => e.userMasterID);
    }
    const condition = {};
    if (userIds.length > 0)
      condition.userMasterID = {
        [Sequelize.Op.in]: userIds,
      };

    if (yearMonth) condition.salaryYYYYMM = yearMonth;

    const salarySlipData = await HrSalarySlip.findAll({
      raw: true,
      where: condition,
      include: [
        {
          model: userMaster,
          where: { companyMasterId: companyMasterID },
          required: true,
          ...accessibleUsers(req.userDetails, false),
          attributes: [],
        },
      ],
      order: [[{ model: userMaster }, 'displayName', 'ASC']],
      attributes: [
        'path',
        [sequelize.col('userMaster.displayName'), 'displayName'],
      ],
    });

    if (salarySlipData.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'No data found to download!',
      });

    return await createZipFileForsalarySlip(
      salarySlipData,
      yearMonth,
      `salarySlip-${yearMonth}`,
      res
    );
  } catch (error) {
    next(error);
  }
};

// exports.addDataDeposit = async (req, res, next) => {
//   try {

//     const allCompany = await companyMaster.findAll({
//       where: {
//         status: [0, 1]
//       }
//     });

//     const finalData = [];

//     for (const compnay of allCompany) {
//       finalData.push(
//         {
//           salaryFieldActive: "Y",
//           payheadMasterId: 96,
//           salaryFieldSide: "D",
//           salaryFieldAttanChk: 1,
//           salaryFieldRound: "Y",
//           salaryFieldSrNo: "B",
//           salaryFieldShow: "Y",
//           salaryFieldWhenMonth: [0],
//           companyMasterID: compnay.companyMasterID,
//           createBy: compnay.createBy,
//           createByIp: compnay.createByIp,
//         },
//         {
//           salaryFieldActive: "Y",
//           payheadMasterId: 97,
//           salaryFieldSide: "E",
//           salaryFieldAttanChk: 1,
//           salaryFieldRound: "Y",
//           salaryFieldSrNo: "A",
//           salaryFieldShow: "Y",
//           salaryFieldWhenMonth: [0],
//           companyMasterID: compnay.companyMasterID,
//           createBy: compnay.createBy,
//           createByIp: compnay.createByIp,
//         }
//       )
//     }

//     await HRSalaryFields.bulkCreate(finalData);

//     return res.status(200).json({
//       status: 200,
//       message: 'data done---------------',
//       data: finalData
//     });

//   } catch (error) {
//     next(error);
//   }
// }

// // add gradesalarystructure

// exports.addDataDepositSalary = async (req, res, next) => {
//   try {

//     const HrsalaryField = await HRSalaryFields.findAll({
//       where: {
//         payheadMasterId: [96, 97]
//       }
//     });

//     const findAllGrade = await GradeStructure.findAll({
//       where:{
//         status:1
//       }
//     });

//     const data = [];

//     for (const grade of findAllGrade){

//       const fields = HrsalaryField.filter(e=>e.companyMasterID == grade.companyMasterID);

//       const data96 = fields.find(e=>e.payheadMasterId == 96);

//       if(data96){
//         data.push({
//           gradeStructureID:grade.gradeStructureID,
//           salaryFieldID: data96.salaryFieldID,
//           fieldFixAmount: 0,
//           createBy: grade.createBy,
//         })
//       }

//       const data97 = fields.find(e=>e.payheadMasterId == 97);

//       if(data97){
//         data.push({
//           gradeStructureID:grade.gradeStructureID,
//           salaryFieldID: data97.salaryFieldID,
//           fieldFixAmount: 0,
//           createBy: grade.createBy,
//         })

//       }
//     }

//     await GradeSalaryStructure.bulkCreate(data);

//     return res.status(200).json({
//       status: 200,
//       message: 'data done---------------',
//       data: data
//     });

//   } catch (error) {
//     next(error);
//   }
// }

// // add salarymaster

// exports.addDataDepositSalary1 = async (req, res, next) => {
//   try {

//     const findAllGrade = await GradeStructure.findAll({
//       where:{
//         status:1
//       }
//     });

//     const data = [];

//     for (const grade of findAllGrade){

//       const findAllGrade = await GradeSalaryStructure.findAll({
//         where:{
//           gradeStructureID: grade.gradeStructureID,
//         },
//         include: [
//           {
//             model: HRSalaryFields,
//             where: {
//               payheadMasterId: {
//                 [Sequelize.Op.in]: [96, 97],
//               },
//             },
//           },
//         ],
//       });

//        // find user

//     const userData = await executeQuery(
//       `
//               select "userMasterID","salaryFromYYYYMM","ptaxinctc",stateid,"AmountIn" from "hrSalaryMasters" as hsm INNER join "gradeSalaryStructures" as gss on hsm."gradeSalaryStructureID" = gss."gradeSalaryStructureID"  where gss."gradeStructureID"=` +
//               grade.gradeStructureID +
//       ` GROUP BY "userMasterID",hsm."salaryFromYYYYMM","ptaxinctc",stateid,"AmountIn"`
//     );

//     for (let j = 0; j < userData.length; j++) {
//       for (let k = 0; k < findAllGrade.length; k++) {

//           data.push(
//             {
//               userMasterID: userData[j].userMasterID,
//               gradeSalaryStructureID: findAllGrade[k].gradeSalaryStructureID,
//               EmployeeSalaryAmount: 0,
//               ActualEmployeeSalaryAmount: 0,
//               salaryFromYYYYMM: userData[j].salaryFromYYYYMM,
//               ptaxinctc: userData[j].ptaxinctc,
//               stateid: userData[j].stateid,
//               AmountIn: userData[j].AmountIn,
//               createBy: findAllGrade[k].createBy,

//             }
//           );

//       }
//     }
//     }

//      await HRSalaryMaster.bulkCreate(data);

//     return res.status(200).json({
//       status: 200,
//       message: 'data done---------------',
//       data: data
//     });

//   } catch (error) {
//     next(error);
//   }
// }

exports.ctcmasterreportNew = async (req, res, next) => {
  const _ = require('lodash');
  try {
    const {
      userMasterID,
      companyMasterID,
      yearmonth,
      limit,
      page,
      exportData,
      exportPdf,
    } = req.body;

    const user = userMasterID,
      companyID = companyMasterID;
    let offset = (page - 1) * limit;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const MainData = [];
    const allEmployeejoining = await EmployeeJoiningDetails.findAll({
      where: {
        userMasterID: userMasterID,
      },
      order: [[Sequelize.col('userMaster.displayName', 'displayName'), 'ASC']],
      include: [
        {
          required: true,
          model: UserMaster,
          // where: {
          //   status: 1,
          // },
          attributes: ['displayName', 'userNumber', 'userMasterID'],
          include: [
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
          ],
        },
      ],
    });

    // const HrSalaryFieldData = await HRSalaryFields.findAll({
    //   raw: true,
    //   where: {
    //     companyMasterID: companyID,
    //     status: 1,
    //     payheadMasterId: {
    //       [Sequelize.Op.notIn]: [1, 50],
    //     },
    //     salaryFieldSrNo: {
    //       [Sequelize.Op.notIn]: ['D'],
    //     },
    //   },
    //   order: [["salaryFieldID", "ASC"]],
    // })

    for (const user of allEmployeejoining) {
      let joingdate =
        user.joiningDate.toString().slice(0, 4) +
        user.joiningDate.toString().slice(5, 7);
      if (joingdate <= yearmonth) {
        const resultsSalary = await HRSalaryMaster.findOne({
          raw: true,
          where: {
            userMasterID: user.userMasterID,
            salaryFromYYYYMM: { [Sequelize.Op.lte]: yearmonth },
          },
          attributes: [
            [
              Sequelize.fn('MAX', Sequelize.col('salaryFromYYYYMM')),
              'maxSalaryFromYYYYMM',
            ],
          ],
        });

        const YYYYMM = resultsSalary.maxSalaryFromYYYYMM;

        let AllField = {};
        AllField['EmployeeCode'] = user.employeeCode;
        AllField['Employee Joining Date'] = moment(
          user.joiningDate,
          'YYYY-MM-DD'
        ).format('DD-MM-YYYY');

        AllField['Date Of Birth'] = user.dob
          ? moment(user.dob, 'YYYY-MM-DD').format('DD-MM-YYYY')
          : '';

        const userData = user.userMaster;
        AllField['Name'] = userData.displayName;
        AllField['Mobile No'] = userData.userNumber;

        AllField['Branch'] =
          (userData.employeeBranches && userData.employeeBranches.length) > 0
            ? userData.employeeBranches[0].branchMaster
              ? userData.employeeBranches[0].branchMaster.branchName
              : ''
            : '';
        AllField['Department'] =
          (userData.employeeDepartments &&
            userData.employeeDepartments.length) > 0
            ? userData.employeeDepartments[0].department
              ? userData.employeeDepartments[0].department.departmentName
              : ''
            : '';
        AllField['Designation'] =
          (userData.employeeDesignations &&
            userData.employeeDesignations.length) > 0
            ? userData.employeeDesignations[0].designation
              ? userData.employeeDesignations[0].designation.designationName
              : ''
            : '';

        const results = await executeQuery(
          `
      SELECT A.*, COALESCE(B.actualamount, 0) as amount FROM (
        SELECT PHM."payheadName",HSF."payheadDisplayName", HSF."payheadMasterId", HSF."salaryFieldSrNo",
          HSF."salaryFieldSide", HSF."salaryFieldShow"
        FROM "hrSalaryFields" as HSF
        INNER JOIN "Payheadmasters" as PHM ON HSF."payheadMasterId" = PHM."payheadMasterId"
        WHERE HSF."companyMasterID"=` +
            companyID +
            ` AND HSF.status=1
          AND HSF."salaryFieldSrNo" NOT IN ('D')
        ORDER BY HSF."salaryFieldID" ASC
      ) as A
      LEFT OUTER JOIN (
        SELECT HSF."payheadMasterId" as payheadid, HSM."EmployeeSalaryAmount" as actualamount
        FROM "hrSalaryMasters" as HSM
        INNER JOIN "gradeSalaryStructures" as GSS ON HSM."gradeSalaryStructureID" = GSS."gradeSalaryStructureID"
        LEFT OUTER JOIN "gradeStructures" as GS ON GSS."gradeStructureID" = GS."gradeStructureID"
        INNER JOIN "hrSalaryFields" as HSF ON GSS."salaryFieldID" = HSF."salaryFieldID"
        INNER JOIN "Payheadmasters" as PHM ON HSF."payheadMasterId" = PHM."payheadMasterId"
        WHERE HSM."userMasterID"=${user.userMasterID} AND HSM."salaryFromYYYYMM"=${YYYYMM} ORDER BY HSF."salaryFieldID" ASC 
      ) as B ON A."payheadMasterId" = B.payheadid`
        );

        let A_Income = [];
        let B_Deduction = [];
        let C_Deduction = [];
        let grossData = null,
          netPayData = null,
          ctcData = null;

        results.forEach((Obj) => {
          if (![1, 50, 92].includes(Obj.payheadMasterId)) {
            if (Obj.salaryFieldSrNo == 'A') {
              A_Income.push(Obj);
            }
            if (Obj.salaryFieldSrNo == 'B') {
              B_Deduction.push(Obj);
            }
            if (Obj.salaryFieldSrNo == 'C') {
              C_Deduction.push(Obj);
            }
          }

          if (Obj.payheadMasterId == 1) ctcData = Obj;
          if (Obj.payheadMasterId == 50) grossData = Obj;
          if (Obj.payheadMasterId == 92) netPayData = Obj;
        });

        let Gross_Deduction = B_Deduction.reduce(
          (acc, obj) => acc + +obj.amount,
          0
        );

        A_Income.forEach((Obj) => {
          AllField[
            Obj.payheadDisplayName && Obj.payheadDisplayName.trim()
              ? Obj.payheadDisplayName
              : Obj.payheadName
          ] = Obj.amount;
        });

        AllField[
          grossData?.payheadDisplayName && grossData?.payheadDisplayName.trim()
            ? grossData?.payheadDisplayName
            : grossData?.payheadName
        ] = grossData?.amount;

        B_Deduction.forEach((Obj) => {
          AllField[
            Obj.payheadDisplayName && Obj.payheadDisplayName.trim()
              ? Obj.payheadDisplayName
              : Obj.payheadName
          ] = Obj.amount;
        });

        AllField['Gross_Deduction'] = Gross_Deduction;
        AllField[
          netPayData?.payheadDisplayName &&
          netPayData?.payheadDisplayName.trim()
            ? netPayData?.payheadDisplayName
            : netPayData?.payheadName
        ] = netPayData?.amount;

        C_Deduction.forEach((Obj) => {
          AllField[
            Obj.payheadDisplayName && Obj.payheadDisplayName.trim()
              ? Obj.payheadDisplayName
              : Obj.payheadName
          ] = Obj.amount;
        });

        AllField[
          ctcData?.payheadDisplayName && ctcData?.payheadDisplayName.trim()
            ? ctcData?.payheadDisplayName
            : ctcData?.payheadName
        ] = ctcData?.amount;

        MainData.push(AllField);
      }
    }

    if (exportData) {
      await generateExcel(MainData, 'CTC Master Report', 'xlsx', res);
      return;
    }

    if (exportPdf) {
      const companyDetails = await companyMaster.findOne({
        where: { companyMasterID: companyID },
        raw: true,
      });

      const { companyName, companyAddress, companyLogo } = companyDetails;

      const headers = Object.keys(MainData[0]);

      const pdfData = {
        datalength: headers.length,
        companyName,
        companyAddress,
        companyLogo,
        headers,
        MainData,
        ApiURL: mainApiUrl,
      };

      const getTemplate1 = (type) => {
        const file = path.join(__dirname, `../html/${type}.html`);
        return file;
      };

      Handlebars.registerHelper({
        eq: (v1, v2) => v1 === v2,
        ne: (v1, v2) => v1 !== v2,
        lt: (v1, v2) => v1 < v2,
        gt: (v1, v2) => v1 > v2,
        lte: (v1, v2) => v1 <= v2,
        gte: (v1, v2) => v1 >= v2,
        and() {
          return Array.prototype.every.call(arguments, Boolean);
        },
        or() {
          return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        },
      });

      const readFile = (name) => {
        return new Promise((resolve, reject) => {
          fs.readFile(name, 'utf-8', (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      };

      const filePath = await getTemplate1('ctcMasterReport');

      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      const html = template(pdfData);

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();

      // Set the HTML content of the page
      await page.setContent(html);

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4', // Page format (A4 in this case)
        printBackground: true, // print background
        landscape: true,
        timeout: 120000,
      });
      await browser.close();

      let base64path = Buffer.from(pdfBuffer).toString('base64');

      return res.status(200).json({
        status: 200,
        data: base64path,
      });
    }

    return res.status(200).json({
      status: 200,
      data: MainData,
      totalcount: MainData.length,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.add_CTC_Gross_Net_In_CompanyandGrade = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const All_company = await companyMaster.findAll({
      where: {
        status: [0, 1],
      },
      attributes: ['companyMasterID', 'createBy'],
    });

    const All_hrsalaryFields = await HRSalaryFields.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: All_company.map((e) => e.companyMasterID),
        },
        payheadMasterId: {
          [Sequelize.Op.in]: [1, 50, 92],
        },
        status: 1,
      },
      attributes: ['salaryFieldID', 'payheadMasterId', 'companyMasterID'],
    });

    const All_GradeData = await GradeStructure.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: All_company.map((e) => e.companyMasterID),
        },
      },
      include: [{ model: GradeSalaryStructure }],
    });

    const gradeStructureData_TO_Add = [];
    for (const company of All_company) {
      const salaryfieldsToAdd = [];

      const companyId = company.companyMasterID;

      const hrsalayfields = All_hrsalaryFields.filter(
        (e) => e.companyMasterID == companyId
      );

      let gross_field = hrsalayfields.find((e) => e.payheadMasterId == 50);
      let net_field = hrsalayfields.find((e) => e.payheadMasterId == 92);
      let ctc_field = hrsalayfields.find((e) => e.payheadMasterId == 1);

      // for Gross
      if (!gross_field) {
        salaryfieldsToAdd.push({
          salaryFieldActive: 'Y',
          payheadMasterId: 50, // gross
          salaryFieldSide: 'E',
          salaryFieldAttanChk: 1,
          salaryFieldRound: 'Y',
          salaryFieldSrNo: 'A',
          salaryFieldShow: 'Y',
          salaryFieldWhenMonth: [0],
          companyMasterID: companyId,
          createBy: company.createBy,
        });
      }

      // for net Pay
      if (!net_field) {
        salaryfieldsToAdd.push({
          salaryFieldActive: 'Y',
          payheadMasterId: 92, // net pay
          salaryFieldSide: 'E',
          salaryFieldAttanChk: 1,
          salaryFieldRound: 'Y',
          salaryFieldSrNo: 'A',
          salaryFieldShow: 'Y',
          salaryFieldWhenMonth: [0],
          companyMasterID: companyId,
          createBy: company.createBy,
        });
      }

      // for CTC
      if (!ctc_field) {
        salaryfieldsToAdd.push({
          salaryFieldActive: 'Y',
          payheadMasterId: 1, // net pay
          salaryFieldSide: 'E',
          salaryFieldAttanChk: 1,
          salaryFieldRound: 'Y',
          salaryFieldSrNo: 'A',
          salaryFieldShow: 'Y',
          salaryFieldWhenMonth: [0],
          companyMasterID: companyId,
          createBy: company.createBy,
        });
      }

      const addedData = await HRSalaryFields.bulkCreate(salaryfieldsToAdd, {
        returning: true,
        transaction,
      });

      if (!gross_field)
        gross_field = addedData.find((e) => e.payheadMasterId == 50);
      if (!net_field)
        net_field = addedData.find((e) => e.payheadMasterId == 92);
      if (!ctc_field) ctc_field = addedData.find((e) => e.payheadMasterId == 1);

      if (gross_field && net_field && ctc_field) {
        const gradeData = All_GradeData.filter(
          (e) => e.companyMasterID == companyId
        );

        for (const grade of gradeData) {
          const salaryStructure = grade.gradeSalaryStructures || [];
          const gradeStructureID = grade.gradeStructureID;

          if (salaryStructure && salaryStructure.length) {
            // find gross

            if (
              ![...salaryStructure].find(
                (e) => e.salaryFieldID == gross_field.salaryFieldID
              )
            ) {
              gradeStructureData_TO_Add.push({
                gradeStructureID: gradeStructureID,
                salaryFieldID: gross_field.salaryFieldID,
                fieldDefaultPer: null,
                fieldFixAmount: null,
                formula: null,
                formulaID: null,
                createBy: salaryStructure[0].createBy,
                salaryfieldindex: null,
                salaryfieldmaxrange: null,
              });
            }

            // find net Pay

            if (
              ![...salaryStructure].find(
                (e) => e.salaryFieldID == net_field.salaryFieldID
              )
            ) {
              gradeStructureData_TO_Add.push({
                gradeStructureID: gradeStructureID,
                salaryFieldID: net_field.salaryFieldID,
                fieldDefaultPer: null,
                fieldFixAmount: null,
                formula: null,
                formulaID: null,
                createBy: salaryStructure[0].createBy,
                salaryfieldindex: null,
                salaryfieldmaxrange: null,
              });
            }

            // find gross

            if (
              ![...salaryStructure].find(
                (e) => e.salaryFieldID == ctc_field.salaryFieldID
              )
            ) {
              gradeStructureData_TO_Add.push({
                gradeStructureID: gradeStructureID,
                salaryFieldID: ctc_field.salaryFieldID,
                fieldDefaultPer: null,
                fieldFixAmount: null,
                formula: null,
                formulaID: null,
                createBy: salaryStructure[0].createBy,
                salaryfieldindex: null,
                salaryfieldmaxrange: null,
              });
            }
          }
        }
      }
    }

    await GradeSalaryStructure.bulkCreate(gradeStructureData_TO_Add, {
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: 'Data added successfully!',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.add_CTC_Gross_Net_In_structure = async (req, res, next) => {
  try {
    const { chunkSize } = req.body;

    if (!chunkSize) throw new Error('chunkSize is required!');

    const All_GradeData = await GradeStructure.findAll({
      where: {
        status: [0, 1],
      },
      include: [
        {
          model: GradeSalaryStructure,
          include: [
            {
              model: HRSalaryFields,
              attributes: [
                'payheadMasterId',
                'salaryFieldRound',
                'salaryFieldRoundNo',
              ],
            },
          ],
        },
      ],
    });

    const All_salaryMasterData = await HRSalaryMaster.findAll({
      include: [
        {
          model: GradeSalaryStructure,
          include: [{ model: HRSalaryFields, attributes: ['payheadMasterId'] }],
        },
      ],
    });

    const Add_final_Structure = [];

    for (const grade of All_GradeData) {
      const salarystructure = grade.gradeSalaryStructures || [];

      // gross data
      const gross_fields = salarystructure.find(
        (e) => e.hrSalaryField.payheadMasterId == 50
      );
      // net pay
      const net_fields = salarystructure.find(
        (e) => e.hrSalaryField.payheadMasterId == 92
      );
      // CTC
      const ctc_fields = salarystructure.find(
        (e) => e.hrSalaryField.payheadMasterId == 1
      );

      const all_Ids = [...salarystructure].map(
        (s) => +s.gradeSalaryStructureID
      );

      const salaryMasterData = All_salaryMasterData.filter((e) =>
        all_Ids.includes(+e.gradeSalaryStructureID)
      );

      // group data month and userwise
      const groupedData = [
        ...new Map(
          salaryMasterData.map((item) => [
            `${item.salaryFromYYYYMM}-${item.userMasterID}`,
            {
              salaryFromYYYYMM: item.salaryFromYYYYMM,
              userMasterID: item.userMasterID,
            },
          ])
        ).values(),
      ];

      for (const data of groupedData) {
        // const masterDataToAdd = [];

        const userMasterID = data.userMasterID;
        const yearMonth = data.salaryFromYYYYMM;

        // get all data of user month wise

        const userSalaryMasterData = await getUserSalaryMasterByMonth(
          userMasterID,
          yearMonth
        );

        if (!userSalaryMasterData.length) continue;

        // caluclate amount of CTC GROSS AND NET SALARY

        const grossAmount = userSalaryMasterData
          .filter(
            (e) =>
              ![1, 50, 92].includes(e.payheadMasterId) &&
              e.salaryFieldSrNo == 'A' &&
              e.considerIn != 'net'
          )
          .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);
        const extraAmount = userSalaryMasterData
          .filter(
            (e) =>
              ![1, 50, 92].includes(e.payheadMasterId) &&
              e.salaryFieldSrNo == 'A' &&
              e.considerIn == 'net'
          )
          .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);
        const deductionAmount = userSalaryMasterData
          .filter(
            (e) =>
              ![1, 50, 92].includes(e.payheadMasterId) &&
              e.salaryFieldSrNo == 'B'
          )
          .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);

        const ctcAmount = userSalaryMasterData
          .filter(
            (e) =>
              ![1, 50, 92].includes(e.payheadMasterId) &&
              ['A', 'C'].includes(e.salaryFieldSrNo)
          )
          .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);

        const netAmount = +grossAmount - +deductionAmount + +extraAmount;

        // FIND data of CTC GROSS AND NET SALARY from master

        let gross_master = userSalaryMasterData.find(
          (e) => e.payheadMasterId == 50
        );
        let net_master = userSalaryMasterData.find(
          (e) => e.payheadMasterId == 92
        );
        let ctc_master = userSalaryMasterData.find(
          (e) => e.payheadMasterId == 1
        );

        if (!gross_master && gross_fields) {
          Add_final_Structure.push({
            userMasterID,
            gradeSalaryStructureID: gross_fields.gradeSalaryStructureID,
            EmployeeSalaryAmount:
              gross_fields.hrSalaryField.salaryFieldRound == 'N'
                ? (+grossAmount).toFixed(
                    +gross_fields.hrSalaryField.salaryFieldRoundNo
                  )
                : Math.round(+grossAmount),
            salaryFromYYYYMM: userSalaryMasterData[0].salaryFromYYYYMM,
            stateid: userSalaryMasterData[0].stateid,
            AmountIn: userSalaryMasterData[0].AmountIn,
            createBy: userSalaryMasterData[0].createBy,
            ActualEmployeeSalaryAmount:
              +grossAmount % 1 != 0 ? (+grossAmount).toFixed(3) : +grossAmount,
          });
        }

        if (!net_master && net_fields) {
          Add_final_Structure.push({
            userMasterID,
            gradeSalaryStructureID: net_fields.gradeSalaryStructureID,
            EmployeeSalaryAmount:
              net_fields.hrSalaryField.salaryFieldRound == 'N'
                ? (+netAmount).toFixed(
                    +net_fields.hrSalaryField.salaryFieldRoundNo
                  )
                : Math.round(+netAmount),
            salaryFromYYYYMM: userSalaryMasterData[0].salaryFromYYYYMM,
            stateid: userSalaryMasterData[0].stateid,
            AmountIn: userSalaryMasterData[0].AmountIn,
            createBy: userSalaryMasterData[0].createBy,
            ActualEmployeeSalaryAmount:
              +netAmount % 1 != 0 ? (+netAmount).toFixed(3) : +netAmount,
          });
        }

        if (!ctc_master && ctc_fields) {
          Add_final_Structure.push({
            userMasterID,
            gradeSalaryStructureID: ctc_fields.gradeSalaryStructureID,
            EmployeeSalaryAmount:
              ctc_fields.hrSalaryField.salaryFieldRound == 'N'
                ? (+ctcAmount).toFixed(
                    +ctc_fields.hrSalaryField.salaryFieldRoundNo
                  )
                : Math.round(+ctcAmount),
            salaryFromYYYYMM: userSalaryMasterData[0].salaryFromYYYYMM,
            stateid: userSalaryMasterData[0].stateid,
            AmountIn: userSalaryMasterData[0].AmountIn,
            createBy: userSalaryMasterData[0].createBy,
            ActualEmployeeSalaryAmount:
              +ctcAmount % 1 != 0 ? (+ctcAmount).toFixed(3) : +ctcAmount,
          });
        }
      }
    }

    // add in batches

    for (let i = 0; i < Add_final_Structure.length; i += chunkSize) {
      await HRSalaryMaster.bulkCreate(
        Add_final_Structure.slice(i, i + chunkSize)
      );
    }

    return res.status(200).json({
      status: 200,
      message: 'Data added successfully!',
      count: Add_final_Structure.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.add_CTC_Gross_Net_In_salary = async (req, res, next) => {
  try {
    const { companyIds, chunkSize } = req.body;

    if (!chunkSize || !companyIds || !Array.isArray(companyIds))
      throw new Error('chunkSize and companyIds are required!');

    const All_salaryMasterData = await HRSalaryMaster.findAll({
      include: [
        {
          model: userMaster,
          where: {
            companyMasterId: {
              [Sequelize.Op.in]: companyIds,
            },
          },
          attributes: ['companyMasterId'],
        },
        {
          model: GradeSalaryStructure,
          include: [
            {
              model: HRSalaryFields,
              attributes: [
                'payheadMasterId',
                'salaryFieldRound',
                'salaryFieldRoundNo',
              ],
            },
          ],
        },
      ],
    });

    const All_salaryData = await HRSalaryTrasaction.findAll({
      include: [
        {
          model: userMaster,
          where: {
            companyMasterId: {
              [Sequelize.Op.in]: companyIds,
            },
          },
          attributes: ['companyMasterId'],
        },
      ],
    });

    for (const company of companyIds) {
      const Add_final_Salary = [];

      const salaryMasterData_companyWise = All_salaryMasterData.filter(
        (e) => e.userMaster.companyMasterId == company
      );

      const salaryData_companyWise = All_salaryData.filter(
        (e) => e.userMaster.companyMasterId == company
      );

      // group data month and userwise
      const groupedData = [
        ...new Map(
          salaryMasterData_companyWise.map((item) => [
            `${item.salaryFromYYYYMM}-${item.userMasterID}`,
            {
              salaryFromYYYYMM: item.salaryFromYYYYMM,
              userMasterID: item.userMasterID,
            },
          ])
        ).values(),
      ];

      for (const data of groupedData) {
        const userMasterID = data.userMasterID;
        const yearMonth = data.salaryFromYYYYMM;

        // get all data of user month wise

        const userSalaryMasterData = salaryMasterData_companyWise.filter(
          (e) =>
            e.userMasterID == userMasterID && e.salaryFromYYYYMM == yearMonth
        );

        if (!userSalaryMasterData.length) continue;

        // FIND data of CTC GROSS AND NET SALARY from master

        const gross_master = userSalaryMasterData.find(
          (e) => e.gradeSalaryStructure.hrSalaryField.payheadMasterId == 50
        );
        const net_master = userSalaryMasterData.find(
          (e) => e.gradeSalaryStructure.hrSalaryField.payheadMasterId == 92
        );
        const ctc_master = userSalaryMasterData.find(
          (e) => e.gradeSalaryStructure.hrSalaryField.payheadMasterId == 1
        );

        //------------------ add data in salary --------------------------

        if (gross_master && net_master && ctc_master) {
          const salaryData = salaryData_companyWise.filter((e) =>
            [...userSalaryMasterData]
              .map((s) => +s.salaryMasterID)
              .includes(+e.salaryMasterID)
          );

          if (!salaryData.length) continue;

          // group data month and userwise
          const groupedsalaryData = [
            ...new Map(
              salaryData.map((item) => [
                `${item.salaryYYYYMM}-${item.userMasterID}`,
                {
                  salaryYYYYMM: item.salaryYYYYMM,
                  userMasterID: item.userMasterID,
                },
              ])
            ).values(),
          ];

          for (const salary of groupedsalaryData) {
            const userMasterID = salary.userMasterID;
            const yearMonth = salary.salaryYYYYMM;

            const salaryData = await getSalaryData(userMasterID, yearMonth);

            // FIND data of CTC GROSS AND NET SALARY from salary

            const gross_salary = salaryData.find(
              (e) => e.payheadMasterId == 50
            );
            const net_salary = salaryData.find((e) => e.payheadMasterId == 92);
            const ctc_salary = salaryData.find((e) => e.payheadMasterId == 1);

            if (gross_salary && net_salary && ctc_salary) continue;

            const grossAmount = salaryData
              .filter(
                (e) =>
                  ![1, 50, 92].includes(e.payheadMasterId) &&
                  e.salaryFieldSrNo == 'A' &&
                  e.considerIn != 'net' &&
                  e.consider != 'net'
              )
              .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);
            const extraAmount = salaryData
              .filter(
                (e) =>
                  ![1, 50, 92].includes(e.payheadMasterId) &&
                  e.salaryFieldSrNo == 'A' &&
                  (e.considerIn == 'net' || e.consider == 'net')
              )
              .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);
            const deductionAmount = salaryData
              .filter(
                (e) =>
                  ![1, 50, 92].includes(e.payheadMasterId) &&
                  ['B', 'D'].includes(e.salaryFieldSrNo) &&
                  e.salaryFieldSide == 'D'
              )
              .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);

            const ctcAmount = salaryData
              .filter(
                (e) =>
                  ![1, 50, 92].includes(e.payheadMasterId) &&
                  ['A', 'C'].includes(e.salaryFieldSrNo)
              )
              .reduce((acc, obj) => acc + +obj.EmployeeSalaryAmount, 0);

            const netAmount = +grossAmount - +deductionAmount + +extraAmount;

            if (gross_master && !gross_salary) {
              Add_final_Salary.push({
                userMasterID,
                salaryMasterID: gross_master.salaryMasterID,
                EmployeeSalaryAmount:
                  gross_master.gradeSalaryStructure.hrSalaryField
                    .salaryFieldRound == 'N'
                    ? (+grossAmount).toFixed(
                        +gross_master.gradeSalaryStructure.hrSalaryField
                          .salaryFieldRoundNo
                      )
                    : Math.round(+grossAmount),
                salaryYYYYMM: salaryData[0].salaryYYYYMM,
                SalaryCalcOnDays: salaryData[0].SalaryCalcOnDays,
                createBy: salaryData[0].createBy,
              });
            }

            if (net_master && !net_salary) {
              Add_final_Salary.push({
                userMasterID,
                salaryMasterID: net_master.salaryMasterID,
                EmployeeSalaryAmount:
                  net_master.gradeSalaryStructure.hrSalaryField
                    .salaryFieldRound == 'N'
                    ? (+netAmount).toFixed(
                        +net_master.gradeSalaryStructure.hrSalaryField
                          .salaryFieldRoundNo
                      )
                    : Math.round(+netAmount),
                salaryYYYYMM: salaryData[0].salaryYYYYMM,
                SalaryCalcOnDays: salaryData[0].SalaryCalcOnDays,
                createBy: salaryData[0].createBy,
              });
            }

            if (ctc_master && !ctc_salary) {
              Add_final_Salary.push({
                userMasterID,
                salaryMasterID: ctc_master.salaryMasterID,
                EmployeeSalaryAmount:
                  ctc_master.gradeSalaryStructure.hrSalaryField
                    .salaryFieldRound == 'N'
                    ? (+ctcAmount).toFixed(
                        +ctc_master.gradeSalaryStructure.hrSalaryField
                          .salaryFieldRoundNo
                      )
                    : Math.round(+ctcAmount),
                salaryYYYYMM: salaryData[0].salaryYYYYMM,
                SalaryCalcOnDays: salaryData[0].SalaryCalcOnDays,
                createBy: salaryData[0].createBy,
              });
            }

            console.log(
              userMasterID,
              '-----------------userMasterId---------------'
            );
          }
        }
      }

      // add in batches

      for (let i = 0; i < Add_final_Salary.length; i += chunkSize) {
        await HRSalaryTrasaction.bulkCreate(
          Add_final_Salary.slice(i, i + chunkSize)
        );
      }

      console.log(company, '---------------salary data added in company');
    }

    return res.status(200).json({
      status: 200,
      message: 'Data added successfully!',
    });
  } catch (error) {
    next(error);
  }
};

exports.add_defaultPayhead_In_Company = async (req, res, next) => {
  try {
    const allCompany = await companyMaster.findAll({
      where: {
        status: [0, 1],
      },
    });

    const AllCompanyHrSalaryFields = await HRSalaryFields.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: allCompany.map((e) => e.companyMasterID),
        },
        payheadMasterId: 101,
        status: 1,
      },
    });

    const gradestructure = await GradeStructure.findAll({
      where: {
        status: 1,
      },
      include: [
        {
          required: false,
          model: GradeSalaryStructure,
          where: {
            salaryFieldID: {
              [Sequelize.Op.in]: AllCompanyHrSalaryFields.map(
                (e) => e.salaryFieldID
              ),
            },
          },
        },
      ],
    });

    const HrsalaryMaster = await HRSalaryMaster.findAll({
      include: [
        {
          required: true,
          model: GradeSalaryStructure,
          include: [
            {
              model: HRSalaryFields,
              where: { payheadMasterId: { [Sequelize.Op.in]: [50, 101] } },
            },
          ],
        },
      ],
    });

    const finaldata = [];

    for (const company of allCompany) {
      const companyMasterID = company.companyMasterID;

      console.log(companyMasterID, 'companyMasterID');

      let payhead = AllCompanyHrSalaryFields.find(
        (e) => e.companyMasterID == companyMasterID && e.payheadMasterId == 101
      );

      if (!payhead) {
        payhead = await HRSalaryFields.create({
          salaryFieldActive: 'Y',
          payheadMasterId: 101, // Bonus Pay
          salaryFieldSide: 'E',
          salaryFieldAttanChk: 1,
          salaryFieldRound: 'Y',
          salaryFieldSrNo: 'A',
          salaryFieldShow: 'Y',
          salaryFieldWhenMonth: [0],
          companyMasterID: companyMasterID,
          createBy: company.createBy,
        });
      }

      if (payhead) {
        const Allgrade = gradestructure.filter(
          (e) => e.companyMasterID == companyMasterID
        );

        for (const grade of Allgrade) {
          let salary_structure = [...grade.gradeSalaryStructures].find(
            (e) => e.salaryFieldID == payhead.salaryFieldID
          );

          if (!salary_structure) {
            salary_structure = await GradeSalaryStructure.create({
              gradeStructureID: grade.gradeStructureID,
              salaryFieldID: payhead.salaryFieldID,
              createBy: grade.createBy,
            });
          }

          if (salary_structure) {
            const all_salaryMaster = HrsalaryMaster.filter(
              (e) =>
                e.gradeSalaryStructure.gradeStructureID ==
                grade.gradeStructureID
            );

            const grossPayhead = all_salaryMaster.filter(
              (e) => e.gradeSalaryStructure.hrSalaryField.payheadMasterId == 50
            );

            for (const master of grossPayhead) {
              const salaryMaster = all_salaryMaster.find(
                (e) =>
                  e.gradeSalaryStructureID ==
                  salary_structure.gradeSalaryStructureID
              );

              if (!salaryMaster) {
                finaldata.push({
                  userMasterID: master.userMasterID,
                  gradeSalaryStructureID:
                    salary_structure.gradeSalaryStructureID,
                  salaryFromYYYYMM: master.salaryFromYYYYMM,
                  ptaxinctc: master.ptaxinctc,
                  stateid: master.stateid,
                  AmountIn: master.AmountIn,
                  createBy: master.createBy,
                });
              }
            }
          }
        }
      }
    }

    const BATCH_SIZE = 1000;

    for (let i = 0; i < finaldata.length; i += BATCH_SIZE) {
      const batch = finaldata.slice(i, i + BATCH_SIZE);
      await HRSalaryMaster.bulkCreate(batch);
    }

    return res.status(200).json({
      status: 200,
      data: finaldata.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.set_EDLIlimit = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const allEmployeeEDlI = await HRSalaryMaster.findAll({
      include: [
        {
          required: true,
          model: GradeSalaryStructure,
          include: [
            {
              model: GradeStructure,
              where: { companyMasterID },
              attributes: [],
            },
            {
              model: HRSalaryFields,
              where: { payheadMasterId: 66 },
              attributes: [],
            },
          ],
        },
      ],
    });

    const gradestructureIds = allEmployeeEDlI.map(
      (a) => a.gradeSalaryStructureID
    );

    // await GradeSalaryStructure.update({
    //   salaryfieldmaxrange: 75
    // }, {
    //   where: {
    //     gradeSalaryStructureID: {
    //       [Sequelize.Op.in]: gradestructureIds
    //     }
    //   }
    // });

    const hrsalarymasterIds = allEmployeeEDlI
      .filter((e) => +e.EmployeeSalaryAmount > 75)
      .map((a) => a.salaryMasterID);

    // await HRSalaryMaster.update({
    //   EmployeeSalaryAmount: 75
    // }, {
    //   where: {
    //     salaryMasterID: {
    //       [Sequelize.Op.in]: hrsalarymasterIds
    //     }
    //   }
    // });

    return res.status(200).json({
      status: 200,
      data: allEmployeeEDlI,
    });
  } catch (error) {
    next(error);
  }
};

async function attendanceData(userMasterID, start_date, end_date) {
  const attendancedata = await attendanceTransaction.findAll({
    where: {
      userMasterID,
      AttendanceDate: {
        [Sequelize.Op.between]: [start_date, end_date],
      },
      // Penalty or Early Go Penalty exists (non-null and non-empty string)
      [Sequelize.Op.or]: [
        {
          Panalty: {
            [Sequelize.Op.and]: [
              { [Sequelize.Op.ne]: null },
              { [Sequelize.Op.ne]: '' },
            ],
          },
        },
        {
          goEarlyPanalty: {
            [Sequelize.Op.and]: [
              { [Sequelize.Op.ne]: null },
              { [Sequelize.Op.ne]: '' },
            ],
          },
        },
      ],

      roundOffMinutes: {
        [Sequelize.Op.or]: [
          {
            [Sequelize.Op.eq]: Sequelize.literal(`
              (SELECT MAX(at2."roundOffMinutes") 
               FROM "attendanceTransactions" AS at2 
               WHERE at2."AttendanceDate" = "attendanceTransaction"."AttendanceDate" 
               AND at2."userMasterID" = "attendanceTransaction"."userMasterID"
               AND at2."roundOffMinutes" IS NOT NULL
              )
            `),
          },

          {
            [Sequelize.Op.and]: [
              Sequelize.literal(`
                NOT EXISTS (
                  SELECT 1 FROM "attendanceTransactions" AS at2
                  WHERE at2."AttendanceDate" = "attendanceTransaction"."AttendanceDate"
                  AND at2."userMasterID" = "attendanceTransaction"."userMasterID"
                  AND at2."roundOffMinutes" IS NOT NULL
                )
              `),
              { [Sequelize.Op.is]: null },
            ],
          },
        ],
      },
      AttendanceTransID: {
        [Sequelize.Op.notIn]: Sequelize.literal(`    
          (WITH duplicate_records AS (
          SELECT
              "trans1"."AttendanceTransID",
              "trans1"."AttendanceDate",
              "trans1"."roundOffMinutes",
              ROW_NUMBER() OVER (
                  PARTITION BY "trans1"."AttendanceDate", "trans1"."roundOffMinutes"
                  ORDER BY "trans1"."AttendanceTransID" ASC
              ) AS row_num
          FROM "attendanceTransactions" AS "trans1"
          JOIN (
              SELECT "AttendanceDate", "roundOffMinutes"
              FROM "attendanceTransactions"
              WHERE "userMasterID" = ${userMasterID}
              AND "AttendanceDate" BETWEEN '${start_date}' and '${end_date}'
              GROUP BY "AttendanceDate", "roundOffMinutes"
              HAVING COUNT(*) > 1
          ) AS "trans"
          ON "trans1"."AttendanceDate" = "trans"."AttendanceDate"
          AND COALESCE(CAST("trans1"."roundOffMinutes" AS INTEGER), -1) =
              COALESCE(CAST("trans"."roundOffMinutes" AS INTEGER), -1)
          WHERE "trans1"."userMasterID" = ${userMasterID}
          AND "trans1"."AttendanceDate" BETWEEN '${start_date}' and '${end_date}'
      )
      SELECT "AttendanceTransID"
      FROM duplicate_records
      WHERE row_num > 1)`),
      },
    },
    order: [['AttendanceDate', 'ASC']],
  });

  return attendancedata;
}

exports.addLCEGPenaltyData = async (req, res, next) => {
  try {
    const { monthArray = [] } = req.body;

    const rawData = await HrLeaveMonthlyTrans.findAll({
      where: {
        AttnYearMon: {
          [Sequelize.Op.in]: monthArray,
        },
        verified: 1,
      },
      include: [
        {
          model: HrLeaveTypes,
          where: {
            LeaveID: {
              [Sequelize.Op.in]: [1, 20],
            },
          },
          attributes: ['LeaveID'],
        },
      ],
    });

    // Group and process data
    const groupedData = {};

    rawData.forEach((item) => {
      const key = `${item.userMasterID}_${item.AttnYearMon}`;
      if (!groupedData[key]) {
        const startdate =
          String(item.AttnYearMon).slice(0, 4) +
          '-' +
          String(item.AttnYearMon).slice(4, 6) +
          '-' +
          '01';
        const enddate =
          String(item.AttnYearMon).slice(0, 4) +
          '-' +
          String(item.AttnYearMon).slice(4, 6) +
          '-' +
          daysInMonth(
            String(item.AttnYearMon).slice(4, 6),
            String(item.AttnYearMon).slice(0, 4)
          );

        groupedData[key] = {
          userMasterID: item.userMasterID,
          AttnYearMon: item.AttnYearMon,
          monthstartdate: item.monthstartdate || startdate,
          monthenddate: item.monthenddate || enddate,
          hasLeaveID20: false,
          createBy: item.createBy,
          createByIp: item.createByIp,
        };
      }

      if (item.hrLeaveType?.LeaveID == 20) {
        groupedData[key].hasLeaveID20 = true;
      }
    });

    const groupedArray = Object.values(groupedData).map((item) => ({
      userMasterID: item.userMasterID,
      AttnYearMon: item.AttnYearMon,
      monthstartdate: item.monthstartdate,
      monthenddate: item.monthenddate,
      salaryType: item.hasLeaveID20 ? 'hourly' : 'daily',
      createBy: item.createBy,
      createByIp: item.createByIp,
    }));

    const userMasterIds = [...new Set(groupedArray.map((e) => e.userMasterID))];

    const finalPenalty = [];

    for (const data of groupedArray) {
      const attendance = await attendanceData(
        data.userMasterID,
        data.monthstartdate,
        data.monthenddate,
        false
      );

      let penaltyMin = 0,
        penaltyAmount = 0,
        penaltyDays = 0,
        penaltyPercent = 0;

      attendance.forEach((e) => {
        const processPenalty = (type) => {
          const value = +e[type];
          const deductionType = e[`${type}Deduction`];

          if (
            value &&
            deductionType &&
            ['min', 'amount', 'day', 'percent'].includes(deductionType)
          ) {
            if (
              (data.salaryType === 'hourly' &&
                deductionType === LCEGPenaltyTypeEnum.MINUTE) ||
              (data.salaryType === 'daily' &&
                deductionType === LCEGPenaltyTypeEnum.DAY)
            ) {
              return;
            }

            switch (deductionType) {
              case 'min':
                penaltyMin += +value;
                break;
              case 'amount':
                penaltyAmount += +value;
                break;
              case 'day':
                penaltyDays += +value;
                break;
              case 'percent':
                penaltyPercent += +value;
                break;
            }
          }
        };

        processPenalty('Panalty');
        processPenalty('goEarlyPanalty');
      });

      // push minute wise
      if (data.salaryType != 'hourly' && +penaltyMin > 0) {
        finalPenalty.push({
          userMasterID: data.userMasterID,
          YYYYMM: data.AttnYearMon,
          penaltyType: LCEGPenaltyTypeEnum.MINUTE,
          penaltyValue: +penaltyMin,
          createBy: data.createBy,
          createByIp: data.createByIp,
        });
      }

      // push Day wise
      if (data.salaryType != 'daily' && +penaltyDays > 0) {
        finalPenalty.push({
          userMasterID: data.userMasterID,
          YYYYMM: data.AttnYearMon,
          penaltyType: LCEGPenaltyTypeEnum.DAY,
          penaltyValue: +penaltyDays,
          createBy: data.createBy,
          createByIp: data.createByIp,
        });
      }

      // push percent wise
      if (+penaltyPercent > 0) {
        finalPenalty.push({
          userMasterID: data.userMasterID,
          YYYYMM: data.AttnYearMon,
          penaltyType: LCEGPenaltyTypeEnum.PERCENT,
          penaltyValue: +penaltyPercent,
          createBy: data.createBy,
          createByIp: data.createByIp,
        });
      }

      // push amount wise
      if (+penaltyAmount > 0) {
        finalPenalty.push({
          userMasterID: data.userMasterID,
          YYYYMM: data.AttnYearMon,
          penaltyType: LCEGPenaltyTypeEnum.AMOUNT,
          penaltyValue: +penaltyAmount,
          createBy: data.createBy,
          createByIp: data.createByIp,
        });
      }

      console.log(
        data.userMasterID,
        '--------------usermasterid-------------------'
      );
    }

    await sequelize.transaction(async (t) => {
      await LCEGPenalty.destroy({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterIds,
          },
          YYYYMM: {
            [Sequelize.Op.in]: monthArray,
          },
        },
        transaction: t,
      });

      await LCEGPenalty.bulkCreate(finalPenalty, {
        hooks: false,
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      data: finalPenalty,
    });
  } catch (error) {
    next(error);
  }
};

exports.paidSalary = async (req, res, next) => {
  try {
    const { userMasterID = [], salaryYYYYMM, paidDate } = req.body;

    if (
      !Array.isArray(userMasterID) ||
      userMasterID.length === 0 ||
      !salaryYYYYMM ||
      !paidDate
    )
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const salarySlipData = await HrSalarySlip.findAll({
      where: {
        userMasterID,
        salaryYYYYMM,
        paid: false,
      },
    });

    await HrSalarySlip.update(
      {
        paid: true,
        paidDate,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: {
          hrSalarySlipID: {
            [Sequelize.Op.in]: salarySlipData.map((e) => e.hrSalarySlipID),
          },
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message: 'Salary paid successfully.',
    });
  } catch (error) {
    next(error);
  }
};
