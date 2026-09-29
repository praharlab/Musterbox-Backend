const Sequelize = require('sequelize');
const Customer = require('../models/customer');
const logger = require('../config/logger');
const message = require('../response_message/message');
const CityMaster = require('../models/citymaster');
const readXlsxFile = require('read-excel-file/node');
const CompanyMasterModel = require('../models/companyMaster');
const Visit = require('../models/visit');
const sequelize = require('../config/database');
const StateMaster = require('../models/statemaster');

const {
  generateExcel,
  genrateDemoExcelForCustomer,
} = require('../utils/exportData');
const companyMaster = require('../models/companyMaster');
const CountryMaster = require('../models/countrymaster');
const fs = require('fs');
const path = require('path');
/**
 * save customer data.
 *
 * @body {createBy} createBy user id of user who added the customer.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.getAllIndiaCityList = async (req, res, next) => {
  try {
    const { countryId } = req.body;
    if (!countryId) {
      return res
        .status(400)
        .json({ status: 400, message: 'Country ID is required.' });
    }

    let city_master = await CityMaster.findAll({
      raw: true,
      where: {
        status: 1,
        '$stateMaster.countryMasterID$': countryId,
      },
      order: [['cityName', 'ASC']],
      include: [{ model: StateMaster }],
    });

    const totalcount = await CityMaster.count({
      raw: true,
      where: {
        status: 1,
        '$stateMaster.countryMasterID$': countryId,
      },
      order: [['cityName', 'ASC']],
      include: [{ model: StateMaster }],
    });

    res
      .status(200)
      .json({ status: 200, data: city_master, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.postAddCustomer = async (req, res, next) => {
  try {
    let = {
      customerName,
      companyName,
      currentLocation,
      mobileNumber1,
      mobileNumber2,
      email,
      website,
      latitude,
      longitude,
      address,
      zipcode,
      cityMasterID,
      companyMasterID,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await Customer.create(
        {
          customerName,
          companyName,
          currentLocation,
          mobileNumber1,
          mobileNumber2,
          email,
          website,
          latitude,
          longitude,
          address,
          zipcode,
          cityMasterID,
          companyMasterID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.customeradd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all customer data
 */

exports.getAllCustomerData = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, companyMasterID, userMasterID } =
      await req.body;

    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: errorMessage.INVALID_FILTER_FIELDS,
      });

    const condition = {};
    condition.companyMasterID = companyMasterID;
    condition.status = 1;

    if (userMasterID) {
      const company = await companyMaster.findOne({
        where: { companyMasterID },
        raw: true,
      });

      if (company && company.customerListPreference == 'created')
        condition.createBy = userMasterID;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { customerName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        { companyName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows, count } = await Customer.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['customerName', 'ASC']],
      include: [{ model: companyMaster }, { model: CityMaster }],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with customer id
 *
 * @param {id} customerID  to fetch customer
 */

exports.getCustomerById = async (req, res, next) => {
  try {
    let get_one_data = await Customer.findOne({
      where: {
        customerID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with customer id
 *
 * @param {id} customerID  to fetch customer name
 */

exports.getCustomerByCompanyId = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID, cityName, exportData, searchQuery } =
      await req.body;

    const condition = {};
    condition.companyMasterID = companyMasterID;
    if (cityName) condition.cityMasterID = cityName;
    condition.status = 1;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { customerName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const customer_data = await Customer.findAll({
      where: condition,
      ...paginationQuery,
      include: [{ all: true, nested: true }],
    });

    const totalcount = await Customer.count({
      where: condition,
    });

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < customer_data.length; i++) {
        const data1 = {
          CustomerName: customer_data[i].customerName,
          CompanyName: customer_data[i].companyName,
          CurrentLocation: customer_data[i].currentLocation,
          Latitude: customer_data[i].latitude,
          Longitude: customer_data[i].longitude,
          Address: customer_data[i].address,
          Zipcode: customer_data[i].zipcode,
          CityName: customer_data[i].cityMaster.cityName,
          CompanyName: customer_data[i].companyMaster.companyName,
          StateName: customer_data[i].cityMaster.stateMaster.stateName,
          CountryName:
            customer_data[i].cityMaster.stateMaster.countryMaster.countryName,
          Status: customer_data[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'filtered_customer', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: customer_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} customerID  to update id
 */
exports.postUpdateCustomer = async (req, res, next) => {
  try {
    let = {
      customerID,
      customerName,
      companyName,
      currentLocation,
      mobileNumber1,
      mobileNumber2,
      email,
      website,
      latitude,
      longitude,
      address,
      zipcode,
      cityMasterID,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await Customer.update(
        {
          customerName,
          companyName,
          currentLocation,
          mobileNumber1,
          mobileNumber2,
          email,
          website,
          latitude,
          longitude,
          address,
          zipcode,
          cityMasterID,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { customerID: customerID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.customerupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} customerID  to update status of customer
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { customerID, status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Customer.update(
          {
            status: '1',
          },
          {
            where: { customerID: customerID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await Visit.findOne({
          where: {
            customerID: customerID,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Customer.Already used in visits.',
          });
        } else {
          delete_status = await Customer.update(
            {
              status: '0',
            },
            {
              where: { customerID: customerID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.customerdelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} customerID  to delete id
 */
exports.postDeleteCustomerById = async (req, res, next) => {
  try {
    let { customerID } = await req.body;

    let data = await Visit.findOne({
      where: {
        customerID: customerID,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message: 'You can not delete this Customer.Already used in visits.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await Customer.update(
          {
            status: 2,
          },
          {
            where: { customerID: customerID },
            transaction: t,
          }
        );

        res
          .status(200)
          .json({ status: 200, message: message.usermessage.customerdelete });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.uploadCustomer = async (req, res) => {
  if (req.file == undefined) {
    return res.status(400).send('Please upload an excel file!');
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // let path = './uploads/' + req.file.filename;
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      let customers = [],
        invalid_cities = [];
      rows.forEach((row) => {
        let customer_data = {
          customerName: row[0],
          companyName: row[1],
          mobileNumber1: row[2],
          address: row[3],
          zipcode: row[4],
          city: row[5],
          mobileNumber2: row[6],
          email: row[7],
          website: row[8],
          currentLocation: row[9],
          latitude: row[10] ? Number(row[10]) : null,
          longitude: row[11] ? Number(row[11]) : null,
          companyMasterID: req.body.companyMasterID,

          status: 1,
          createBy: req.body.createBy,
          createByIp: req.body.createByIp,
        };
        customers.push(customer_data);
      });

      for (var i = 0; i < customers.length; i++) {
        let check_city = await CityMaster.findOne({
          where: Sequelize.where(
            Sequelize.fn('lower', Sequelize.col('cityName')),
            customers[i].city.toLowerCase()
          ),
        });

        if (check_city == null) {
          invalid_cities.push(customers[i].city);
        } else {
          customers[i] = {
            ...customers[i],
            cityMasterID: check_city.cityMasterID,
          };
        }
      }

      if (invalid_cities.length > 0) {
        res.status(200).send({
          status: 401,
          message: 'Invalid city names',
          data: invalid_cities,
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_status = await Customer.bulkCreate(customers, {
            transaction: t,
          })
            .then(() => {
              res.status(200).send({
                status: 200,
                message:
                  'Uploaded the file successfully: ' + req.file.originalname,
              });
            })
            .catch((error) => {
              res.status(200).send({
                status: 401,
                message: 'Fail to import data into database!' + error.message,
                error: error.message,
              });
            });
          return insert_status;
        });
      }
    });
  } catch (error) {
    res.status(500).send({
      message: 'Could not upload the file: ' + req.file.originalname,
    });
  }
};

exports.getAllCustomerDataOptimized = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let customer_data = [];
    if (limit == '' && page == '') {
      customer_data = await Customer.findAll({
        order: [['customerName', 'ASC']],
        where: {
          companyMasterID: req.body.id,
          status: 1,
        },
        include: [
          {
            model: CityMaster,
          },
        ],
      });
    } else {
      customer_data = await Customer.findAll({
        where: {
          companyMasterID: req.body.id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['customerName', 'ASC']],
        include: [
          {
            model: CityMaster,
          },
        ],
      });
    }

    const totalcount = await Customer.count({
      raw: true,
      where: {
        companyMasterID: req.body.id,
        status: ['0', '1'],
      },
    });

    res
      .status(200)
      .json({ status: 200, data: customer_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
  try {
    // const path = './uploads/' + req.file.filename;
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();

    const data = [];
    for (const row of rows) {
      if (row[0] != null && row[0].trim() != '') {
        let cityid = await CityMaster.findOne({
          where: { cityName: { [Sequelize.Op.iLike]: row[11] } },
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                  required: true,
                },
              ],
              required: true,
            },
          ],
        });

        let customerMaster = {
          customerName: row[0].trim(),
          companyName: row[1],
          currentLocation: row[2],
          // cityMasterID: row[3],
          latitude: row[3] ? row[3] : null,
          longitude: row[4] ? row[4] : null,
          mobileNumber1: row[5],
          mobileNumber2: row[6],
          email: row[7],
          website: row[8],
          address: row[9],
          zipcode: row[10],
          cityMasterID: row[11] ? row[11] : null,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
          countryMasterID: '',
          stateMasterID: '',
        };

        if (cityid) {
          customerMaster.cityMasterID = cityid.cityMasterID;
          customerMaster.countryMasterID =
            cityid.stateMaster.countryMaster.countryMasterID;
          customerMaster.stateMasterID = cityid.stateMaster.stateMasterID;
        } else {
          customerMaster.remarks = 'Customer City Name Not Exist';
        }

        // const duplicateInExcel = data.find(
        //   (s) =>
        //     s.customerName &&
        //     typeof s.customerName === 'string' &&
        //     s.customerName.toLowerCase() ===
        //       customerMaster.customerName.toLowerCase()
        // );

        // if (duplicateInExcel) {
        //   customerMaster.remarks = 'Duplicate Customer Name in Excel';
        // } else {
        //   const condition = {
        //     companyMasterID: req.body.companyMasterID,
        //     status: [0, 1],
        //     customerName: {
        //       [Sequelize.Op.iLike]: customerMaster.customerName,
        //     },
        //   };

        //   const uniquedata = await Customer.findAll({
        //     where: condition,
        //   });

        //   if (uniquedata.length > 0) {
        //     customerMaster.remarks = 'Customer Already Exists';
        //   }
        // }
        data.push(customerMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.customerValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateCustomer = async (req, res, next) => {
  try {
    const {
      customerData,
      // companyMasterID
    } = req.body;

    let data = [];

    for (const row of customerData) {
      // Ensure the row is an object and has the required fields
      if (row.customerName && row.customerName.trim() !== '') {
        let customerMaster = {
          customerName: row.customerName.trim(),
          companyName: row.companyName,
          currentLocation: row.currentLocation,
          latitude: row.latitude ? row.latitude : null,
          longitude: row.longitude ? row.longitude : null,
          mobileNumber1: row.mobileNumber1 ? row.mobileNumber1 : null,
          mobileNumber2: row.mobileNumber2 ? row.mobileNumber2 : null,
          email: row.email ? row.email : '',
          website: row.website ? row.website : '',
          address: row.address,
          zipcode: row.zipcode,
          cityMasterID: row.cityMasterID,
          countryMasterID: row.countryMasterID,
          stateMasterID: row.stateMasterID,
          remarks: '',
        };

        // Check for duplicates in `data` array
        // const duplicateInData = data.some(
        //   (s) =>
        //     s.customerName.trim().toLowerCase() ===
        //     customerMaster.customerName.trim().toLowerCase()
        // );

        // if (duplicateInData) {
        //   customerMaster.remarks = 'Duplicate Customer Name in Data';
        // } else {
        //   // Check for duplicates in the database
        //   const condition = {
        //     companyMasterID: companyMasterID,
        //     status: [0, 1],
        //     customerName: {
        //       [Sequelize.Op.iLike]: customerMaster.customerName,
        //     },
        //   };

        //   const uniquedata = await Customer.findAll({
        //     where: condition,
        //   });

        //   if (uniquedata && uniquedata.length > 0) {
        //     customerMaster.remarks = 'Customer Already Exists';
        //   }
        // }

        data.push(customerMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.customerReValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateCustomer = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { customerData, companyMasterID } = req.body;

    await Customer.bulkCreate(
      customerData.map((item) => ({
        customerName: item.customerName.trim(),
        companyName: item.companyName,
        currentLocation: item.currentLocation,
        latitude: item.latitude ? item.latitude : null,
        longitude: item.longitude ? item.longitude : null,
        mobileNumber1: item.mobileNumber1,
        mobileNumber2: item.mobileNumber2 ? item.mobileNumber2 : null,
        email: item.email ? item.email : '',
        website: item.website ? item.website : '',
        address: item.address,
        zipcode: item.zipcode,
        cityMasterID: item.cityMasterID,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.customeradd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;
    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['cityName', 'ASC']];
    const { rows, count } = await CityMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });
    const cityNames = rows.map((row) => row.cityName);
    await genrateDemoExcelForCustomer(cityNames, 'Demo Customer', 'xlsx', res);
  } catch (err) {
    next(err);
  }
};
