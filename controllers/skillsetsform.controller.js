const Sequelize = require('sequelize');
const SkillsetsformModel = require('../models/skillsetsform');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMaster = require('../models/companyMaster');
const DesignationMaster = require('../models/designation');
const UserMaster = require('../models/userMaster');
const SkillSets = require('../models/skillsets');
const MonthlySkillsetsForm = require('../models/monthlySkillsetsform');

exports.AddSkillSetsForm = async (req, res, next) => {
  try {
    let {
      skillSetsID,
      companyMasterID,
      designationID,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;

    let checkPerDesignation = await SkillsetsformModel.findAll({
      raw: true,
      where: {
        companyMasterId: companyMasterID,
        designationID: designationID,
        status: 1,
      },
    });

    if (checkPerDesignation.length > 0) {
      return res.status(200).json({
        status: 400,
        message:
          'Form is there for This Designation You Can Only Update form For this Designation',
      });
    }

    const duplicates = [];
    const uniqueValues = new Set();

    for (const value of skillSetsID) {
      if (uniqueValues.has(value)) {
        let get_one_data = await SkillSets.findAll({
          raw: true,
          where: {
            skillSetID: value,
          },
        });
        duplicates.push(get_one_data[0].skillSet);
      } else {
        uniqueValues.add(value);
      }
    }

    if (duplicates.length > 0) {
      return res.status(200).json({
        status: 400,
        message: duplicates + ' Duplicate SkillSets Found',
      });
    }

    let result = await sequelize.transaction(async (t) => {
      insert_db_status = await SkillsetsformModel.create({
        skillSetsID: skillSetsID,
        companyMasterId: companyMasterID,
        designationID: designationID,
        createBy: createBy,
        createByIp: createByIp,
      });
    });

    res.status(200).json({
      status: 200,
      message: 'SkillsetsForm Added Successfully.',
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.UpdateSkillSetsForm = async (req, res, next) => {
  try {
    let = { skillsetsFormID, skillSetsID, updateBy, updateByIp } =
      await req.body;
    let change_data_status;

    const duplicates = [];
    const uniqueValues = new Set();

    for (const value of skillSetsID) {
      if (uniqueValues.has(value)) {
        duplicates.push(value);
      } else {
        uniqueValues.add(value);
      }
    }

    if (duplicates.length > 0) {
      return res
        .status(200)
        .json({ status: 400, message: 'Duplicate SkillSets Found' });
    }

    let result = await sequelize.transaction(async (t) => {
      change_data_status = await SkillsetsformModel.update(
        {
          skillSetsID,
          updateBy,
          updateByIp,
        },
        {
          where: { skillsetsFormID: skillsetsFormID },
        }
      );
    });

    res
      .status(200)
      .json({ status: 200, message: 'SkillsetsForm Updated Successfully' });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.DeleteSkillSetsFormById = async (req, res, next) => {
  try {
    let = { skillsetsFormID } = await req.body;

    let get_one_data = await MonthlySkillsetsForm.findAll({
      where: {
        skillsetsFormID: skillsetsFormID,
        status: 1,
      },
    });

    if (get_one_data.length > 0) {
      return res.status(200).json({
        status: 400,
        message: "SkillsetsForm is Assign to Someone. You Can't Delete  It.",
      });
    }

    let delete_status = await SkillsetsformModel.update(
      {
        status: 2,
      },
      {
        where: { skillsetsFormID: skillsetsFormID },
      }
    );
    res
      .status(200)
      .json({ status: 200, message: 'SkillsetsForm Deleted Successfully' });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getAllSkillSetsFormData = async (req, res, next) => {
  try {
    let { limit, page, company_id } = await req.body;
    let offset = (page - 1) * limit;
    let SkillsetsformData = [];
    let totalcount;

    let companyid = [];
    companyid.push(parseInt(company_id));
    let get_one_data = await CompanyMaster.findAll({
      where: { parentCompanyMasterID: company_id, status: [0, 1] },
    });
    for (let i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }

    if (limit == '' && page == '') {
      SkillsetsformData = await SkillsetsformModel.findAll({
        where: {
          companyMasterId: companyid,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: DesignationMaster,
            attributes: ['designationId', 'designationName'],
          },
        ],
      });

      for (var j = 0; j < SkillsetsformData.length; j++) {
        let get_one_data = await SkillSets.findAll({
          where: {
            skillSetID: SkillsetsformData[j].skillSetsID,
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: SkillsetsformData[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: SkillsetsformData[j].updateBy,
          },
        });

        if (user1) {
          SkillsetsformData[j].createBy = user1.displayName;
        }
        if (user2) {
          SkillsetsformData[j].updateBy = user2.displayName;
        }
        if (get_one_data) {
          SkillsetsformData[j].skillSetsID = get_one_data;
        }
      }
    } else {
      SkillsetsformData = await SkillsetsformModel.findAll({
        where: {
          companyMasterId: companyid,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: DesignationMaster,
            attributes: ['designationId', 'designationName'],
          },
        ],
      });

      for (var j = 0; j < SkillsetsformData.length; j++) {
        let get_one_data = await SkillSets.findAll({
          where: {
            skillSetID: SkillsetsformData[j].skillSetsID,
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: SkillsetsformData[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: SkillsetsformData[j].updateBy,
          },
        });

        if (user1) {
          SkillsetsformData[j].createBy = user1.displayName;
        }
        if (user2) {
          SkillsetsformData[j].updateBy = user2.displayName;
        }
        if (get_one_data) {
          SkillsetsformData[j].skillSetsID = get_one_data;
        }
      }
    }

    totalcount = await SkillsetsformModel.count({
      raw: true,
      where: {
        companyMasterId: companyid,
        status: ['0', '1'],
      },
    });

    res
      .status(200)
      .json({ status: 200, data: SkillsetsformData, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getSkillSetsFormById = async (req, res, next) => {
  try {
    let SkillsetsformData = await SkillsetsformModel.findAll({
      raw: true,
      where: {
        skillsetsFormID: req.params.id,
      },
      include: [
        {
          model: CompanyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: DesignationMaster,
          attributes: ['designationId', 'designationName'],
        },
      ],
    });

    for (var j = 0; j < SkillsetsformData.length; j++) {
      let get_one_data = await SkillSets.findAll({
        where: {
          skillSetID: SkillsetsformData[j].skillSetsID,
        },
        include: [
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
        ],
      });

      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: SkillsetsformData[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: SkillsetsformData[j].updateBy,
        },
      });

      if (user1) {
        SkillsetsformData[j].createBy = user1.displayName;
      }
      if (user2) {
        SkillsetsformData[j].updateBy = user2.displayName;
      }
      if (get_one_data) {
        SkillsetsformData[j].skillSetsID = get_one_data;
      }
    }

    if (!SkillsetsformData)
      res.status(200).json({ status: 200, message: 'No Record Found' });

    res.status(200).json({ status: 200, data: SkillsetsformData });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getSkillSetsFormByCompanyId = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID, designationID } = await req.body;
    let offset = (page - 1) * limit;
    let SkillsetsformData, totalcount;
    if (page == '' && limit == '') {
      if (!designationID) {
        SkillsetsformData = await SkillsetsformModel.findAll({
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: DesignationMaster,
              attributes: ['designationId', 'designationName'],
            },
          ],
        });

        for (var j = 0; j < SkillsetsformData.length; j++) {
          let get_one_data = await SkillSets.findAll({
            where: {
              skillSetID: SkillsetsformData[j].skillSetsID,
            },
            include: [
              {
                model: CompanyMaster,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
          });

          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].createBy,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].updateBy,
            },
          });

          if (user1) {
            SkillsetsformData[j].createBy = user1.displayName;
          }
          if (user2) {
            SkillsetsformData[j].updateBy = user2.displayName;
          }
          if (get_one_data) {
            SkillsetsformData[j].skillSetsID = get_one_data;
          }
        }

        totalcount = await SkillsetsformModel.count({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
        });
      } else {
        SkillsetsformData = await SkillsetsformModel.findAll({
          where: {
            companyMasterId: companyMasterID,
            designationID: designationID,
            status: 1,
          },
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: DesignationMaster,
              attributes: ['designationId', 'designationName'],
            },
          ],
        });

        for (var j = 0; j < SkillsetsformData.length; j++) {
          let get_one_data = await SkillSets.findAll({
            where: {
              skillSetID: SkillsetsformData[j].skillSetsID,
            },
            include: [
              {
                model: CompanyMaster,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
          });

          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].createBy,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].updateBy,
            },
          });

          if (user1) {
            SkillsetsformData[j].createBy = user1.displayName;
          }
          if (user2) {
            SkillsetsformData[j].updateBy = user2.displayName;
          }
          if (get_one_data) {
            SkillsetsformData[j].skillSetsID = get_one_data;
          }
        }

        totalcount = await SkillsetsformModel.count({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
            designationID: designationID,
            status: 1,
          },
        });
      }
    } else {
      if (!designationID) {
        SkillsetsformData = await SkillsetsformModel.findAll({
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
          limit: limit,
          offset: offset,
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: DesignationMaster,
              attributes: ['designationId', 'designationName'],
            },
          ],
        });

        for (var j = 0; j < SkillsetsformData.length; j++) {
          let get_one_data = await SkillSets.findAll({
            where: {
              skillSetID: SkillsetsformData[j].skillSetsID,
            },
            include: [
              {
                model: CompanyMaster,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
          });

          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].createBy,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].updateBy,
            },
          });

          if (user1) {
            SkillsetsformData[j].createBy = user1.displayName;
          }
          if (user2) {
            SkillsetsformData[j].updateBy = user2.displayName;
          }
          if (get_one_data) {
            SkillsetsformData[j].skillSetsID = get_one_data;
          }
        }

        totalcount = await SkillsetsformModel.count({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
        });
      } else {
        SkillsetsformData = await SkillsetsformModel.findAll({
          where: {
            companyMasterId: companyMasterID,
            designationID: designationID,
            status: 1,
          },
          limit: limit,
          offset: offset,
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: DesignationMaster,
              attributes: ['designationId', 'designationName'],
            },
          ],
        });

        for (var j = 0; j < SkillsetsformData.length; j++) {
          let get_one_data = await SkillSets.findAll({
            where: {
              skillSetID: SkillsetsformData[j].skillSetsID,
            },
            include: [
              {
                model: CompanyMaster,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
          });

          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].createBy,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: SkillsetsformData[j].updateBy,
            },
          });

          if (user1) {
            SkillsetsformData[j].createBy = user1.displayName;
          }
          if (user2) {
            SkillsetsformData[j].updateBy = user2.displayName;
          }
          if (get_one_data) {
            SkillsetsformData[j].skillSetsID = get_one_data;
          }
        }

        totalcount = await SkillsetsformModel.count({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
            designationID: designationID,
            status: 1,
          },
        });
      }
    }

    res.status(200).json({
      status: 200,
      data: SkillsetsformData,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getSkillSets = async (req, res, next) => {
  try {
    let { skillSetIDs } = await req.body;
    let get_one_data = await SkillSets.findAll({
      where: {
        skillSetID: skillSetIDs,
      },
      include: [
        {
          model: CompanyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });

    if (!get_one_data)
      res.status(200).json({ status: 200, message: 'No Record Found' });

    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.statuschange = async (req, res, next) => {
  try {
    let = { skillsetsFormID, status } = await req.body;
    let delete_status;

    let get_one_data = await MonthlySkillsetsForm.findAll({
      where: {
        skillsetsFormID: skillsetsFormID,
        status: 1,
      },
    });

    if (get_one_data.length > 0) {
      return res.status(200).json({
        status: 400,
        message:
          "SkillsetsForm is Assign to Someone. You Can't Change Status It.",
      });
    }

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        chnage_status = await SkillsetsformModel.update(
          {
            status: '1',
          },
          {
            where: { skillsetsFormID: skillsetsFormID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        chnage_status = await SkillsetsformModel.update(
          {
            status: '0',
          },
          {
            where: { skillsetsFormID: skillsetsFormID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (chnage_status != 0) {
        res.status(200).json({
          status: 200,
          message: 'SkillsetsForm Status Change Successfully',
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: 'SkillsetsForm Status Change Successfully',
          data: {},
        });
      }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};
