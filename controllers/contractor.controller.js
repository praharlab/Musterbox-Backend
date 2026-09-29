const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const Contractor = require("../models/contractor");
const message = require("../response_message/message");
const companyMaster = require("../models/companyMaster");
const CityMaster = require("../models/citymaster");
const logger = require("../config/logger");
const StateMaster = require("../models/statemaster");
const {
  generateExcel,
  genrateDemoExcelForContractor,
} = require("../utils/exportData");
const readXlsxFile = require("read-excel-file/node");
const BankMaster = require("../models/bankMaster");
const CountryMaster = require("../models/countrymaster");
const { isValidDate } = require("../utils/commonUtilFunctions");
const fs = require("fs");
const path = require("path");
const { convertNameToLocalName } = require("../utils/labelUtils");
const { Translate } = require("@google-cloud/translate").v2;

// add api
exports.postadddata = async (req, res, next) => {
  try {
    const {
      contractorName,
      shortName,
      contractorCode,
      website,
      contactPersonName,
      contactNo,
      dateofIncorporation,
      email,
      bankMasterID,
      bankIFSC,
      bankAccountNo,
      pancard,
      gstNumber,
      companyMasterID,
      cityMasterID,
      status,
      registrationNo,
      aboutContractor,
      createByIp,
      contractorAddress,
      contractorFullAddress,
    } = await req.body;

    const contractor = await Contractor.findOne({
      where: {
        companyMasterID,
        contactNo,
        status: [0, 1],
      },
    });

    if (contractor) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Contractor"),
      });
    }
    let localName = null;
    let localAddress = null;

    if (convertNameToLocalName) {
      if (
        companyMasterID == 744 ||
        companyMasterID == 965 ||
        companyMasterID == 968 ||
        companyMasterID == 969 ||
        companyMasterID == 970 ||
        companyMasterID == 971 ||
        companyMasterID == 998 ||
        companyMasterID == 999 ||
        companyMasterID == 1000 
      ) {
        try {
          const translate = new Translate({
            key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
          });

          const response = await translate.translate(
            [
              contractorName,
              contractorFullAddress ? contractorFullAddress : "",
            ],
            {
              from: "en", // Explicitly specify English as the source
              to: "mr",
              format: "text",
              model: "base",
            }
          );

          // Extract transliterated values
          localName = response[0]?.[0] || null;
          localAddress = response[0]?.[1] || null;
        } catch (error) {
          console.error("Error in translation:", error);
        }
      }
    }
    await Contractor.create(
      {
        contractorName,
        shortName,
        contractorCode,
        website,
        contactPersonName,
        contactNo,
        dateofIncorporation,
        email,
        companyMasterID,
        cityMasterID,
        status,
        registrationNo,
        aboutContractor,
        bankMasterID,
        bankIFSC,
        bankAccountNo,
        pancard,
        gstNumber,
        createBy: req.userDetails.userMasterId,
        createByIp,
        contractorAddress,
        localName,
        localAddress,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Contractor"),
    });
  } catch (err) {
    next(err);
  }
};

// get all data api
exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, companyMasterID, Export } = req.query;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { contractorName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await Contractor.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        { model: companyMaster, attributes: ["companyName"] },
        { model: CityMaster, attributes: ["cityName"] },
        { model: BankMaster, attributes: ["bankName"] },
      ],
      order: [["contractorId", "ASC"]],
    });

    if (Export == "true") {
      const finaldata = rows.map((e) => {
        return {
          "Company Name": e["companyMaster.companyName"],
          "Contractor Name": e.contractorName,
          "Short Name": e.shortName,
          "Contractor Code": e.contractorCode,
          Website: e.website,
          "Contact PersonName": e.contactPersonName,
          "Contact No": e.contactNo,
          "Date of Incorporation": e.dateofIncorporation,
          Email: e.email,
          "Registration No": e.registrationNo,
          "About Contractor": e.aboutContractor,
          "contractor Address": e.contractorAddress,
          "City Name": e["cityMaster.cityName"],
          "Bank Name": e["bankMaster.bankName"],
          "IFSC Code": e.bankIFSC,
          "Account No": e.bankAccountNo,
          Pancard: e.pancard,
          "GST No": e.gstNumber,
          Status: e.status == 0 ? "Deactive" : "Active",
        };
      });

      await generateExcel(finaldata, "Contractor", "xlsx", res);
      return;
    }

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get api
exports.getdata = async (req, res, next) => {
  try {
    const contractorId = req.params.id;
    const Data = await Contractor.findOne({
      where: {
        contractorId: contractorId,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: CityMaster,
          attributes: ["cityMasterID", "cityName"],
          include: [{ model: StateMaster }],
        },
        {
          model: companyMaster,
          attributes: ["companyMasterID", "companyName"],
        },
        {
          model: BankMaster,
          attributes: ["bankMasterID", "bankName"],
        },
      ],
      raw: true,
    });
    if (!Data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }

    return res.status(200).json({ status: 200, data: Data });
  } catch (err) {
    next(err);
  }
};
// // edit api

exports.editdata = async (req, res, next) => {
  try {
    let {
      contractorName,
      shortName,
      contractorCode,
      website,
      contactPersonName,
      contactNo,
      dateofIncorporation,
      email,
      companyMasterID,
      cityMasterID,
      registrationNo,
      aboutContractor,
      bankMasterID,
      bankIFSC,
      bankAccountNo,
      pancard,
      gstNumber,
      updateByIp,
      contractorAddress,
    } = await req.body;

    const currentdata = await Contractor.findOne({
      where: {
        contractorId: req.params.id,
      },
    });

    if (!currentdata)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.deletedrecord,
      });

    const contractor = await Contractor.findOne({
      where: {
        companyMasterID,
        contactNo,
        status: [0, 1],
        contractorId: {
          [Sequelize.Op.ne]: req.params.id,
        },
      },
    });

    if (contractor) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Contractor"),
      });
    }

    if (convertNameToLocalName) {
      if (
        companyMasterID == 744 ||
        companyMasterID == 965 ||
        companyMasterID == 968 ||
        companyMasterID == 969 ||
        companyMasterID == 970 ||
        companyMasterID == 971 ||
        companyMasterID == 998 ||
        companyMasterID == 999 ||
        companyMasterID == 1000
      ) {
        try {
          const cityWiseData = await CityMaster.findOne({
            where: { cityMasterID: cityMasterID },
            attributes: ["cityName"],
            include: [
              {
                required: true,
                model: StateMaster,
                attributes: ["stateName"],
                include: [
                  {
                    required: true,
                    model: CountryMaster,
                    attributes: ["countryName"],
                  },
                ],
              },
            ],
          });
          const fullContractorAddress = contractorAddress
            ? `${contractorAddress}, ${cityWiseData.cityName}, ${cityWiseData.stateMaster.stateName},  ${cityWiseData.stateMaster.countryMaster.countryName}`
            : `${cityWiseData.cityName}, ${cityWiseData.stateMaster.stateName},  ${cityWiseData.stateMaster.countryMaster.countryName}`;
            
          const translate = new Translate({
            key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
          });

          const response = await translate.translate(
            [contractorName, fullContractorAddress],
            {
              from: "en", // Explicitly specify English as the source
              to: "mr",
              format: "text",
              model: "base",
            }
          );

          // Extract transliterated values
          let localName = response[0]?.[0] || null;
          let localAddress = response[0]?.[1] || null;

          currentdata.localName = localName;
          currentdata.localAddress = localAddress;
        } catch (error) {
          console.error("Error in translation:", error);
        }
      }
    }
    currentdata.contractorName = contractorName;
    currentdata.shortName = shortName;
    currentdata.contractorCode = contractorCode;
    currentdata.website = website;
    currentdata.contactPersonName = contactPersonName;
    currentdata.contactNo = contactNo;
    currentdata.dateofIncorporation = dateofIncorporation;
    currentdata.email = email;
    currentdata.cityMasterID = cityMasterID;
    currentdata.registrationNo = registrationNo;
    currentdata.aboutContractor = aboutContractor;
    currentdata.companyMasterID = companyMasterID;
    currentdata.cityMasterID = cityMasterID;
    currentdata.bankMasterID = bankMasterID;
    currentdata.bankIFSC = bankIFSC;
    currentdata.bankAccountNo = bankAccountNo;
    currentdata.pancard = pancard;
    currentdata.gstNumber = gstNumber;
    currentdata.contractorAddress = contractorAddress;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Contractor"),
    });
  } catch (error) {
    next(error);
  }
};

// // delete api
// delete api
exports.deletedata = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await Contractor.findByPk(id);

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: "Contractor not found!",
      });
    }

    // Perform deletion
    await findData.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Contractor"),
    });
  } catch (error) {
    next(error);
  }
};

// active,deactive user
exports.poststatuschange = async (req, res, next) => {
  try {
    let { contractorId, status } = await req.body;

    await Contractor.update(
      {
        status,
      },
      {
        where: { contractorId },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == "1"
          ? message.usermessage.activeMessage("Contractor")
          : message.usermessage.deactiveMessage("Contractor"),
    });
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: "Please upload an excel file!" });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
  try {
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const convertExcelDateToISO = (excelDate) => {
      return new Date(Math.round(excelDate - 25569) * 86400 * 1000)
        .toISOString()
        .slice(0, 10);
    };

    const formatDateStringToISO = (dateString) => {
      return new Date(dateString).toISOString().slice(0, 10);
    };
    const data = [];
    for (const row of rows) {
      if (row[0] != null && row[0].trim() != "") {
        let cityid = await CityMaster.findOne({
          where: { cityName: { [Sequelize.Op.iLike]: row[7] } },
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
        let bankid = await BankMaster.findOne({
          where: { bankName: { [Sequelize.Op.iLike]: row[9] } },
        });

        let contractorMaster = {
          contractorName: row[0].trim(),
          website: row[1],
          shortName: row[2] ? row[2].trim() : null,
          contactPersonName: row[3],
          contractorCode: row[4],
          contactNo: row[5],
          email: row[6],
          cityMasterID: row[7],
          dateofIncorporation: row[8],
          bankMasterID: row[9] ? row[9] : null,
          bankIFSC: row[10],
          bankAccountNo: row[11],
          pancard: row[12],
          gstNumber: row[13],
          registrationNo: row[14],
          aboutContractor: row[15],
          companyMasterID: req.body.companyMasterID,
          remarks: "",
          countryMasterID: "",
          stateMasterID: "",
          contractorAddress: row[16],
        };

        if (typeof row[8] === "number") {
          contractorMaster.dateofIncorporation = convertExcelDateToISO(row[8]);
        } else if (isValidDate(row[8])) {
          contractorMaster.dateofIncorporation = formatDateStringToISO(row[8]);
        } else {
          contractorMaster.dateofIncorporation = null;
          contractorMaster.remarks =
            "Incorporation Date Should be in 'yyyy-mm-dd'";
        }

        if (cityid) {
          contractorMaster.cityMasterID = cityid.cityMasterID;
          contractorMaster.countryMasterID =
            cityid.stateMaster.countryMaster.countryMasterID;
          contractorMaster.stateMasterID = cityid.stateMaster.stateMasterID;
        } else {
          contractorMaster.remarks = "Contractor City Name Not Exist";
        }

        if (bankid) {
          contractorMaster.bankMasterID = bankid.bankMasterID;
        }
        data.push(contractorMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: "Contractor Validate successfully.",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateContractor = async (req, res, next) => {
  try {
    const { contractorData, companyMasterID } = req.body;

    let data = [];

    for (const row of contractorData) {
      // Ensure the row is an object and has the required fields
      if (row.contractorName && row.contractorName.trim() !== "") {
        let contractorMaster = {
          contractorName: row.contractorName.trim(),
          website: row.website,
          shortName: row.shortName.trim(),
          contactPersonName: row.contactPersonName.trim(),
          contractorCode: row.contractorCode.trim(),
          contactNo: row.contactNo,
          email: row.email,
          cityMasterID: row.cityMasterID,
          dateofIncorporation: row.dateofIncorporation,
          bankMasterID: row.bankMasterID,
          bankAccountNo: row.bankAccountNo,
          pancard: row.pancard,
          gstNumber: row.gstNumber,
          registrationNo: row.registrationNo,
          aboutContractor: row.aboutContractor,
          remarks: "",
          countryMasterID: row.countryMasterID,
          stateMasterID: row.stateMasterID,
          contractorAddress: row.contractorAddress,
        };

        data.push(contractorMaster);
      }
    }

    return res.status(200).json({
      status: 200,
      message: "Contractor Re-Validate successfully.",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
exports.addValidateContractor = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { contractorData, companyMasterID } = req.body;

    await Contractor.bulkCreate(
      contractorData.map((item) => ({
        contractorName: item.contractorName.trim(),
        website: item.website,
        shortName: item.shortName.trim(),
        contactPersonName: item.contactPersonName.trim(),
        contractorCode: item.contractorCode.trim(),
        contactNo: item.contactNo,
        email: item.email,
        cityMasterID: item.cityMasterID,
        dateofIncorporation: item.dateofIncorporation,
        bankMasterID: item.bankMasterID,
        bankAccountNo: item.bankAccountNo,
        pancard: item.pancard,
        gstNumber: item.gstNumber,
        registrationNo: item.registrationNo,
        aboutContractor: item.aboutContractor,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
        contractorAddress: item.contractorAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Contractor"),
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
    const order = [["cityName", "ASC"]];
    const cityData = await CityMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });
    const cityNames = cityData.rows.map((row) => row.cityName);
    const bankData = await BankMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
    });
    const bankNames = bankData.rows.map((row) => row.bankName);

    await genrateDemoExcelForContractor(
      cityNames,
      bankNames,
      "Demo Contractor",
      "xlsx",
      res
    );
  } catch (err) {
    next(err);
  }
};
