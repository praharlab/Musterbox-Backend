const Sequelize = require('sequelize');
const SkillSets = require('../models/skillsets');
const logger = require('../config/logger');
const UserMaster = require('../models/userMaster');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMaster = require('../models/companyMaster');
const readXlsxFile = require('read-excel-file/node');
const SkillsetsForm = require('../models/skillsetsform');
const path = require('path');

exports.addSkillSet = async (req, res, next) => {
  try {
    let { companyMasterID, skillSet, createBy, createByIp } = await req.body;
    let companyMasterId = companyMasterID;
    let insert_data = await SkillSets.create({
      companyMasterId,
      skillSet: skillSet.trim(),
      createBy,
      createByIp,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.skillsetsadd,
      data: insert_data,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getAllSkillSet = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID, searchQuery } = await req.body;

    let offset = (page - 1) * limit;
    let skillSet_data = [];
    let totalcount;

    const companyid = [];
    if (companyMasterID) {
      companyid.push(parseInt(companyMasterID));
      let get_one_data = await CompanyMaster.findAll({
        where: { parentCompanyMasterID: companyMasterID, status: [0, 1] },
      });
      for (let i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
    }

    if (limit == '' && page == '' && searchQuery) {
      if (companyMasterID) {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          order: [['createdAt', 'DESC']],
          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            companyMasterId: companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            companyMasterId: companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });
      } else {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          order: [['createdAt', 'DESC']],
          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });
      }

      for (var j = 0; j < skillSet_data.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: skillSet_data[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: skillSet_data[j].updateBy,
          },
        });

        if (user1) {
          skillSet_data[j].createBy = user1.displayName;
        }
        if (user2) {
          skillSet_data[j].updateBy = user2.displayName;
        }
      }
    } else if (limit == '' && page == '') {
      if (companyMasterID) {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          order: [['createdAt', 'DESC']],
          where: {
            companyMasterId: companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });
      } else {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          order: [['createdAt', 'DESC']],
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });
      }

      for (var j = 0; j < skillSet_data.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: skillSet_data[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: skillSet_data[j].updateBy,
          },
        });

        if (user1) {
          skillSet_data[j].createBy = user1.displayName;
        }
        if (user2) {
          skillSet_data[j].updateBy = user2.displayName;
        }
      }
    } else if (limit && page && searchQuery) {
      if (companyMasterID) {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            companyMasterId: companyMasterID,
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
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,

          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            companyMasterId: companyMasterID,
            status: ['0', '1'],
          },
        });
      } else {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
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
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,

          where: {
            [Sequelize.Op.or]: [
              {
                skillSet: {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            status: ['0', '1'],
          },
        });
      }
    } else {
      if (companyMasterID) {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
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
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,
          where: {
            companyMasterId: companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });
      } else {
        skillSet_data = await SkillSets.findAll({
          raw: true,
          where: {
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
          ],
        });

        totalcount = await SkillSets.count({
          raw: true,
          where: { status: ['0', '1'] },
        });
      }

      for (var j = 0; j < skillSet_data.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: skillSet_data[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: skillSet_data[j].updateBy,
          },
        });

        if (user1) {
          skillSet_data[j].createBy = user1.displayName;
        }
        if (user2) {
          skillSet_data[j].updateBy = user2.displayName;
        }
      }
    }

    res
      .status(200)
      .json({ status: 200, data: skillSet_data, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with skillSet id
 *
 * @param {id} skillSetID  to fetch skillSet name
 */

exports.getSkillSetById = async (req, res, next) => {
  try {
    let get_one_data = await SkillSets.findOne({
      where: {
        skillSetID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: CompanyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.skillsetsrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.updateSkillSet = async (req, res, next) => {
  try {
    let { skillSetID, skillSet, companyMasterID, updateBy, updateByIp } =
      await req.body;
    let companyMasterId = companyMasterID;
    let get_one_data = await SkillsetsForm.findAll({
      where: {
        skillSetsID: {
          [Sequelize.Op.contains]: [skillSetID],
        },
        status: 1,
      },
    });

    if (get_one_data.length > 0) {
      return res.status(200).json({
        status: 400,
        message: "Skillset is Assign to Someone. You Can't Update It.  ",
        get_one_data,
      });
    }

    console.log(get_one_data);
    let change_data_status = await SkillSets.update(
      {
        skillSetID,
        skillSet,
        companyMasterId,
        updateBy,
        updateByIp,
      },
      {
        where: { skillSetID: skillSetID },
      }
    );

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.skillsetsupdate });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.deleteSkillSetById = async (req, res, next) => {
  try {
    let = { skillSetID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      // let skillid =

      console.log(skillSetID);
      let get_one_data = await SkillsetsForm.findAll({
        where: {
          skillSetsID: {
            [Sequelize.Op.contains]: [skillSetID],
          },
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        return res.status(200).json({
          status: 400,
          message: "Skillset is Assign to Someone. You Can't Delete It.  ",
          get_one_data,
        });
      }

      let update_status = await SkillSets.update(
        {
          status: 2,
        },
        {
          where: { skillSetID: skillSetID },
          transaction: t,
        }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.skillsetsdelete,
        get_one_data,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.statuschange = async (req, res, next) => {
  try {
    let = { skillSetID, status } = await req.body;
    let delete_status;

    let get_one_data = await SkillsetsForm.findAll({
      where: {
        skillSetsID: {
          [Sequelize.Op.contains]: [skillSetID],
        },
        status: 1,
      },
    });

    if (get_one_data.length > 0) {
      return res.status(200).json({
        status: 400,
        message: "Skillset is Assign to Someone. You Can't Change Status It.  ",
        get_one_data,
      });
    }

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        chnage_status = await SkillSets.update(
          {
            status: '1',
          },
          {
            where: { skillSetID: skillSetID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        chnage_status = await SkillSets.update(
          {
            status: '0',
          },
          {
            where: { skillSetID: skillSetID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (chnage_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.skillsetsStatus,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.skillsetsStatus,
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

exports.uploadexcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      let skillsetData = [];
      rows.forEach((row) => {
        if (row[0] != null && row[0].trim() != '') {
          let skillsetDatamaster = {
            skillSet: row[0].trim(),
            companyMasterId: req.body.companyMasterID,
            status: 1,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          };
          skillsetData.push(skillsetDatamaster);
        }
      });
      let data = [];
      for (var i = 0; i < skillsetData.length; i++) {
        const result = data.filter((s) =>
          s.skillSet.includes(skillsetData[i].skillSet)
        );

        if (result.length > 0) {
          return res.status(200).send({
            status: 401,
            message:
              'Duplicate Skillset Name Exist In Excel. ' + result[0].skillSet,
          });
        } else {
          let uniquedata = await SkillSets.findOne({
            where: {
              skillSet: {
                [Sequelize.Op.iLike]: skillsetData[i].skillSet,
              },
              companyMasterId: req.body.companyMasterID,
              status: 1,
            },
          });

          if (uniquedata) {
            return res.status(200).json({
              status: 401,
              message: 'Skillset Already Exist ' + uniquedata.skillSet,
              data: {},
            });
          }
        }
        data.push(skillsetData[i]);
      }

      SkillSets.bulkCreate(skillsetData).catch((error) => {
        res.status(200).send({
          status: 401,
          message: 'Fail to import excel! ' + error.message,
          error: error.message,
        });
      });
      res.status(200).json({
        status: 200,
        message: message.usermessage.skillsetsadd,
        data: {},
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Could not upload the file: ' + req.file.originalname,
    });
  }
};

exports.getAllSkillSetUsingCompanyID = async (req, res, next) => {
  try {
    let { companyMasterID } = await req.body;

    let skillSet_data = [];
    let totalcount;

    if (companyMasterID) {
      skillSet_data = await SkillSets.findAll({
        raw: true,
        order: [['skillSet', 'ASC']],
        where: {
          companyMasterId: companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
        ],
      });

      totalcount = await SkillSets.count({
        raw: true,
        where: {
          companyMasterId: companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: skillSet_data, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
