const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const message = require('../response_message/message');
const Project = require('../models/project');
const { companyAttributes, userAttributes } = require('../utils/commonVars');
const { convert } = require('html-to-text');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
const EmployeeProject = require('../models/employeeProject');
const UserMaster = require('../models/userMaster');
const axios = require('axios');
const { Op } = require('sequelize');
const { find } = require('lodash');
const UserExpense = require('../models/userExpense');
const Site = require('../models/site');
const BranchMaster = require('../models/branchMaster');
const moment = require('moment');

exports.addProject = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      projectName,
      projectDescription,
      short_name,
      siteID,
      branchMasterID,
      display_id,
    } = req.body;
    projectName = projectName.trim();
    display_id = display_id.trim();
    const findProject = await Project.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('projectName'))
          ),
          projectName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });

    if (findProject) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Project With Same Name'),
      });
    }
    const findProjectWithSameProjectCode = await Project.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('display_id'))
          ),
          display_id.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });
    if (findProjectWithSameProjectCode) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Project With Same Project Code'
        ),
      });
    }
    await Project.create(
      {
        companyMasterID,
        projectName,
        projectDescription,
        short_name,
        siteID,
        branchMasterID,
        display_id,
      },
      {
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Project'),
    });
  } catch (error) {
    next(error);
  }
};

exports.listProjects = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, searchQuery, exportData, status } =
      req.body;

    const condition = {};

    if (status) condition.status = status;

    condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { projectName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows: projectData, count } = await Project.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        { model: companyMaster, attributes: companyAttributes },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
        {
          required: false,
          model: Site,
        },
        {
          required: false,
          model: BranchMaster,
        },
      ],
      order: [['projectID', 'DESC']],
    });

    if (exportData) {
      const finaldata = projectData.map((e) => {
        return {
          'Company Name': e.companyMaster.companyName,
          'Branch Name': e.branchMaster?.branchName || '',
          'Site Name': e.site?.siteName || '',
          'Project Name': e.projectName,
          'Project Code': e.display_id,
          'Project Description': e.projectDescription
            ? convert(e.projectDescription)
            : '',
          Status: e.status == 0 ? 'Deactive' : 'Active',
          'created By': e.createBy
            ? `${e.createdByUserDetails.dispalyName} At ${moment(e.createdAt).format('DD-MM-YYYY HH:mm')}`
            : '',
          'Updated By': e.updateBy
            ? `${e.updatedByUserDetails.dispalyName} At ${moment(e.updatedAt).format('DD-MM-YYYY HH:mm')}`
            : '',
        };
      });

      return await generateExcel(finaldata, 'Project', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: projectData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectByID = async (req, res, next) => {
  try {
    const { projectID } = req.query;

    const findData = await Project.findByPk(projectID, {
      include: [{ model: companyMaster, attributes: companyAttributes }],
    });

    return res.status(200).json({
      status: 200,
      data: findData,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const {
      projectID,
      projectName,
      projectDescription,
      short_name,
      branchMasterID,
      siteID,
      display_id,
    } = req.body;
    const findData = await Project.findByPk(projectID);

    if (!findData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Project'),
      });
    }
    const findProject = await Project.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('projectName'))
          ),
          projectName.trim().toLowerCase()
        ),
        Sequelize.where(
          sequelize.col('companyMasterID'),
          findData.companyMasterID
        ),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('projectID'), {
          [Sequelize.Op.ne]: projectID,
        })
      ),
    });

    if (findProject) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Project With Same Name'),
      });
    }
    const findProjectWithSameProjectCode = await Project.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('display_id'))
          ),
          display_id.trim().toLowerCase()
        ),
        Sequelize.where(
          sequelize.col('companyMasterID'),
          findData.companyMasterID
        ),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('projectID'), {
          [Sequelize.Op.ne]: projectID,
        })
      ),
    });
    if (findProjectWithSameProjectCode) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Project With Same Project Code'
        ),
      });
    }
    findData.projectName = projectName;
    findData.projectDescription = projectDescription;
    findData.short_name = short_name;
    findData.display_id = display_id;
    findData.branchMasterID = branchMasterID ? branchMasterID : null;
    findData.siteID = siteID ? siteID : null;

    await findData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Project'),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const { projectID } = req.body;

    const findEmployeeProject = await EmployeeProject.findOne({
      where: {
        projectID,
        status: ['0', '1'],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            status: [0, 1],
          },
        },
      ],
    });

    if (findEmployeeProject) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign('Project', 'Delete'),
      });
    }
    const findProjectExpense = await UserExpense.findOne({
      where: {
        projectID,
      },
    });
    if (findProjectExpense) {
      return res.status(200).json({
        status: 401,
        message:
          'Employees already Applied For Expense so You Can not Delete Project',
      });
    }
    const findData = await Project.findByPk(projectID);

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Project'),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { projectID, status } = req.body;

    if (status == 0) {
      const findEmployeeProject = await EmployeeProject.findOne({
        where: {
          projectID,
          status: ['0', '1'],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              status: [0, 1],
            },
          },
        ],
      });
      if (findEmployeeProject) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign('Project', 'deactive'),
        });
      }
    }

    const findData = await Project.findByPk(projectID);
    findData.status = status;
    await findData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message:
        status == 1
          ? message.usermessage.activeMessage('Project')
          : message.usermessage.deactiveMessage('Project'),
    });
  } catch (error) {
    next(error);
  }
};

exports.demoProjectExcel = async (req, res, next) => {
  try {
    const finaldata = [
      {
        'Project Name': '',
        'Project Code': '',
        'Project Short Name': '',
        'Project Description': '',
      },
    ];

    return await generateExcel(finaldata, 'Project', 'xlsx', res);
  } catch (error) {
    next(error);
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
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const condition = {
      companyMasterID: req.body.companyMasterID,
      status: [0, 1],
    };

    const findAllProject = await Project.findAll({
      where: condition,
    });
    const data = [];
    for (const row of rows) {
      let projectMaster = {
        projectName: row[0]?.toString().trim() || null,
        display_id: row[1]?.toString().trim() || null,
        short_name: row[2]?.toString().trim() || null,
        projectDescription: row[3]?.toString().trim() || null,
        companyMasterID: req.body.companyMasterID,
        remarks: [],
        isDeleted: false,
      };

      if (!projectMaster.projectName) {
        projectMaster.remarks.push('Project Name is required');
      } else {
        const duplicateProjectNameInExcel = data.find(
          (s) =>
            s.projectName &&
            typeof s.projectName === 'string' &&
            s.projectName?.toLowerCase() ===
              projectMaster.projectName?.toLowerCase()
        );

        if (duplicateProjectNameInExcel) {
          projectMaster.remarks.push('Duplicate Project Name in Excel');
        } else {
          const uniquedata =
            findAllProject && findAllProject.length
              ? findAllProject.find(
                  (e) =>
                    e.projectName.trim().toLowerCase() ==
                    projectMaster.projectName.trim().toLowerCase()
                )
              : null;

          if (uniquedata) {
            projectMaster.remarks.push('Project With Same Name Already Exists');
          }
        }
      }

      if (!projectMaster.display_id) {
        projectMaster.remarks.push('Project Code is required');
      } else {
        const duplicateProjectCodeInExcel = data.find(
          (s) =>
            s.display_id &&
            typeof s.display_id === 'string' &&
            s.display_id.toLowerCase() ===
              projectMaster.display_id.toLowerCase()
        );
        if (duplicateProjectCodeInExcel) {
          projectMaster.remarks.push('Duplicate Project Code in Excel');
        } else {
          const uniquedata =
            findAllProject && findAllProject.length
              ? findAllProject.find(
                  (e) =>
                    e.display_id?.trim().toLowerCase() ==
                    projectMaster.display_id?.trim().toLowerCase()
                )
              : null;

          if (uniquedata) {
            projectMaster.remarks.push('Project With Same Code Already Exists');
          }
        }
      }
      data.push(projectMaster);
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.validateMessage('Project'),
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateProject = async (req, res, next) => {
  try {
    const { projectData, companyMasterID } = req.body;

    let data = [];
    const condition = {
      companyMasterID: companyMasterID,
      status: [0, 1],
    };
    const findAllProject = await Project.findAll({
      where: condition,
    });
    for (const row of projectData) {
      let projectMaster = {
        projectName: row.projectName?.toString().trim() || null,
        display_id: row.display_id?.toString().trim() || null,
        short_name: row.short_name?.toString().trim() || null,
        projectDescription: row.projectDescription?.toString().trim() || null,
        companyMasterID: row.companyMasterID,
        remarks: [],
        isDeleted: false,
      };
      if (!projectMaster.projectName) {
        projectMaster.remarks.push('Project Name is required');
      } else {
        const duplicateProjectNameInExcel = data.some(
          (s) =>
            s.projectName.trim().toLowerCase() ===
            projectMaster.projectName.trim().toLowerCase()
        );

        if (duplicateProjectNameInExcel) {
          projectMaster.remarks.push('Duplicate Project Name in Data');
        } else {
          const uniquedata =
            findAllProject && findAllProject.length
              ? findAllProject.find(
                  (e) =>
                    e.projectName.trim().toLowerCase() ==
                    projectMaster.projectName.trim().toLowerCase()
                )
              : null;

          if (uniquedata) {
            projectMaster.remarks.push('Project With Same Name Already Exists');
          }
        }
      }

      if (!projectMaster.display_id) {
        projectMaster.remarks.push('Project Code is required');
      } else {
        const duplicateProjectCodeInExcel = data.some(
          (s) =>
            s.display_id?.trim().toLowerCase() ===
            projectMaster.display_id?.trim().toLowerCase()
        );

        if (duplicateProjectCodeInExcel) {
          projectMaster.remarks.push('Duplicate Project Code in Data');
        } else {
          const uniquedata =
            findAllProject && findAllProject.length
              ? findAllProject.find(
                  (e) =>
                    e.display_id?.trim().toLowerCase() ==
                    projectMaster.display_id?.trim().toLowerCase()
                )
              : null;

          if (uniquedata) {
            projectMaster.remarks.push('Project With Same Code Already Exists');
          }
        }
      }
      data.push(projectMaster);
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.reValidateMessage('Project'),
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateProject = async (req, res, next) => {
  try {
    const { projectData, companyMasterID } = req.body;

    await Project.bulkCreate(
      projectData.map((item) => ({
        projectName: item.projectName.trim(),
        projectDescription: item.projectDescription,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
        short_name: item.short_name,
        display_id: item.display_id,
      }))
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Project'),
    });
  } catch (err) {
    next(err);
  }
};

exports.syncProject = async (req, res, next) => {
  try {
    const companyId = req.query.companyId;
    const companyData = await companyMaster.findOne({
      where: {
        companyMasterID: companyId,
      },
      raw: true,
    });
    if (companyData?.companyMasterID) {
      const apiUrl = `${process.env.PROJAPIURL}?company=${companyData.companyName}`;
      const apiKey = process.env.PROJAPIKEY;
      const response = await axios.get(apiUrl, {
        headers: { 'X-API-KEY': apiKey },
      });
      const data = response?.data || [];

      if (data.length > 0) {
        const existingProjects = await Project.findAll({
          attributes: ['display_id'],
          where: {
            companyMasterID: companyData?.companyMasterID,
          },
          raw: true,
        });

        const projectData = data.map((x) => ({
          projectName: x.name,
          companyMasterID: companyData?.companyMasterID,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.userIpAddress,
          display_id: x.display_id,
          short_name: x.short_name,
          status: x.physical_status === 'Non-Operational' ? 0 : 1,
        }));

        const existingDisplayIds = existingProjects.map((x) => x.display_id);
        const apiDisplayIds = projectData.map((x) => x.display_id);

        const toUpdate = projectData.filter((x) =>
          existingDisplayIds.includes(x.display_id)
        );
        const toCreate = projectData.filter(
          (x) => !existingDisplayIds.includes(x.display_id)
        );
        const toDelete = existingProjects.filter(
          (x) => !apiDisplayIds.includes(x.display_id)
        );

        for (const project of toUpdate) {
          await Project.update(
            {
              projectName: project.projectName,
              short_name: project.short_name,
              status: project.status,
            },
            {
              where: {
                display_id: project.display_id,
                companyMasterID: companyData?.companyMasterID,
              },
            }
          );
        }

        if (toCreate.length > 0) {
          await Project.bulkCreate(toCreate);
        }

        if (toDelete.length > 0) {
          const deletedIds = toDelete.map((x) => x.display_id);
          console.log(deletedIds);
          await Project.update(
            { status: 0 },
            {
              where: {
                display_id: deletedIds,
                companyMasterID: companyData?.companyMasterID,
              },
            }
          );
        }

        return res.status(200).json({
          status: 200,
          message: 'Projects Synced.',
        });
      } else {
        return res.status(200).json({
          status: 200,
          message: 'No Record(s) found for Sync.',
        });
      }
    }
    return res.status(200).json({
      status: 200,
      message: 'No Record(s) found for Sync.',
    });
  } catch (err) {
    next(err);
  }
};
