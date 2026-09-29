const sequelize = require('sequelize');
const employeeHolidayPolicy = require('../models/employeeHolidayPolicy');
const holidayPolicy = require('../models/holidayPolicy');
const holidayList = require('../models/holidayList');

const fetchCurrentYearHolidays = async (userMasterId) => {
  const currentYear = new Date().getFullYear();
  const firstDay = new Date(currentYear, 0, 1);
  const lastDay = new Date(currentYear, 11, 31);
  const holidays = await employeeHolidayPolicy.findAndCountAll({
    where: {
      applicableDate: { [sequelize.Op.lte]: lastDay },
      endDate: {
        [sequelize.Op.or]: [
          { [sequelize.Op.gte]: firstDay },
          { [sequelize.Op.is]: null },
        ],
      },
      userMasterID: userMasterId,
    },
    include: [
      {
        model: holidayPolicy,
        as: 'HolidayPolicy',
        include: [{ model: holidayList }],
      },
    ],
  });
  const holidaysToDisplay = holidays.rows.map((e) => {
    const data = e.toJSON();
    return data.HolidayPolicy.holidayLists;
  });

  const flattenedData = [].concat(...holidaysToDisplay);

  const groupedById = flattenedData.reduce((acc, obj) => {
    acc[obj.holidayListID] = acc[obj.holidayListID] || [];
    acc[obj.holidayListID].push(obj);
    return acc;
  }, {});

  // Map holidayListName with holidayDate for each unique holidayListID
  const mappedData = {};
  Object.keys(groupedById).forEach((id) => {
    const chosenObject = groupedById[id][0]; // Choosing the first object for each ID
    const mappedDates = {};
    chosenObject.holidayListName.forEach((holiday, index) => {
      mappedDates[holiday] = new Date(
        chosenObject.holidayDate[index]
      ).toLocaleDateString();
    });
    mappedData[id] = mappedDates;
  });

  return mappedData;
};

module.exports = { fetchCurrentYearHolidays };
