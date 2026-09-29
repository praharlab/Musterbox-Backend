const Sequelize = require('sequelize');
const LeadMaster = require('../models/leadMaster');
const message = require('../response_message/message');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');

exports.addLeadMaster = async (req, res, next) => {
  try {
    let {
      companyName,
      companyAddress,
      cpName,
      cpMobileNo,
      cpEmail,
      createByIp,
      cityMasterID,
    } = await req.body;
    let registrationStatus = 'Pending';
    const addLeadData = await LeadMaster.create({
      leadCompanyName: companyName,
      leadCompanyAddress: companyAddress,
      contactPersonName: cpName,
      contactPersonMobileNo: cpMobileNo,
      contactPersonEmail: cpEmail,
      registrationStatus,
      createBy: 4,
      createByIp,
      cityMasterID,
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addLeadMaster,
      data: addLeadData.leadMasterID,
    });
  } catch (err) {
    next(err);
  }
};

exports.getallLead = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      searchQuery,
      registrationStatus,
      startdate,
      enddate,
      exportData,
    } = await req.query;
    const condition = {};

    if (startdate && enddate) {
      enddate = new Date(enddate);
      enddate.setDate(enddate.getDate() + 1);
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }
    if (registrationStatus && registrationStatus == 'Pending') {
      condition.status = 1;
    }
    if (registrationStatus && registrationStatus == 'Registered') {
      condition.status = 0;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { leadCompanyName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        { leadCompanyAddress: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows: getAllLeadData, count } = await LeadMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
    });

    if (exportData) {
      const finalData = [];

      for (var item of getAllLeadData) {
        const temp = {
          'Lead Company Name': item.leadCompanyName,
          'Lead Company Address': item.leadCompanyAddress,
          'Contact Person Name': item.contactPersonName,
          'contact Person Mobile No': item.contactPersonMobileNo,
          'Contact Person Email': item.contactPersonEmail,
          'Registration Status': item.registrationStatus,
          'Created At': asiaKolkataDateTime(item.createdAt),
        };
        finalData.push(temp);
      }
      await generateExcel(finalData, 'Lead Master', 'xlsx', res);
      return;
    }
    return res.status(200).json({
      status: 200,
      data: getAllLeadData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
