const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const JobPosting = require("../models/jobPosting");
const message = require("../response_message/message");
const companyMaster = require("../models/companyMaster");
const BranchMaster = require("../models/branchMaster");
const Department = require("../models/department");
const Designation = require("../models/designation");
const { generateExcel } = require("../utils/exportData");
const moment = require("moment");
const { generateSecretKey } = require("../utils/commonUtilFunctions");
const JobRoleClassification = require("../models/jobRoleClassification");

// add api
exports.addJobPosting = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      jobTitle,
      employmentType,
      jobDescription,
      jobLocation,
      requirements,
      lastApplicableDate,
      minSalary,
      maxSalary,
      noOfPosition,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      jobRoleClassificationID,
    } = await req.body;
    if (minSalary > maxSalary) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "Max Salary Can Not be less then Min Salary",
      });
    }
    if (noOfPosition <= 0) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "No. Of Position atleast 1",
      });
    }
    if (minSalary < 0) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "Minimum Salary Can Not Be Negative",
      });
    }
    if (maxSalary < 0) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "Maximum Salary Can Not Be Negative",
      });
    }
    const secretKey = await generateSecretKey(16);
    await JobPosting.create(
      {
        jobTitle,
        employmentType,
        jobDescription,
        jobLocation,
        requirements,
        lastApplicableDate,
        minSalary,
        maxSalary,
        noOfPosition,
        companyMasterID,
        branchMasterID,
        departmentId,
        designationId,
        secretKey,
        jobRoleClassificationID
      },
      { user: req.userDetails },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Job Posting"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// get all data api
exports.listJobPostingData = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      exportData,
      searchQuery,
    } = req.body;

    const condition = {};

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    if (companyMasterID) {
      condition.companyMasterID = companyMasterID;
    }
    if (branchMasterID) {
      condition.branchMasterID = branchMasterID;
    }
    if (departmentId) {
      condition.departmentId = departmentId;
    }
    if (designationId) {
      condition.designationId = designationId;
    }
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          "$designation.designationName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          jobTitle: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          employmentType: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          jobLocation: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];
    }
    const { rows: jobPostingData, count } = await JobPosting.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: companyMaster,
          attributes: ["companyMasterID", "companyName"],
        },
        {
          model: BranchMaster,
          attributes: ["branchMasterID", "branchName", "branchCode"],
        },
        {
          model: Department,
          attributes: ["departmentId", "departmentName"],
        },
        {
          model: Designation,
          attributes: ["designationId", "designationName"],
        },
        {
          model: JobRoleClassification,
          attributes: [
            "jobRoleClassificationID",
            "jobRoleClassificationName",
            "jobRoleClassificationDescription",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const finaldata = jobPostingData.map((e) => {
      return {
        jobPostingID: e.jobPostingID,
        Company: e.companyMaster.companyName,
        Branch: e.branchMaster.branchName,
        Department: e.department.departmentName,
        Designation: e.designation.designationName,
        jobTitle: e.jobTitle,
        employmentType: e.employmentType,
        jobRoleClassificationName:
          e.jobRoleClassification?.jobRoleClassificationName,
        jobLocation: e.jobLocation,
        requirements: e.requirements,
        lastApplicableDate: e.lastApplicableDate
          ? moment(e.lastApplicableDate).format("DD-MM-YYYY")
          : "dd-MM-yyyy",
        minSalary: e.minSalary,
        maxSalary: e.maxSalary,
        noOfPosition: e.noOfPosition,
        postingDate: e.createdAt
          ? moment(e.createdAt).format("DD-MM-YYYY")
          : "",
      };
    });
    if (exportData) {
      const dataToEXport = jobPostingData.map((e) => {
        return {
          Company: e.companyMaster.companyName,
          Branch: e.branchMaster.branchName,
          Department: e.department.departmentName,
          Designation: e.designation.designationName,
          "Job Title": e.jobTitle,
          "Job Type": e.jobRoleClassification?.jobRoleClassificationName,
          "Employment Type": e.employmentType,
          "Job Location": e.jobLocation,
          Requirements: e.requirements,
          "Last ApplicableDate": e.lastApplicableDate
            ? moment(e.lastApplicableDate).format("DD-MM-YYYY")
            : "",
          "Min Salary": e.minSalary,
          "Max Salary": e.maxSalary,
          "No Of Position": e.noOfPosition,
          "Posting Date": e.createdAt
            ? moment(e.createdAt).format("DD-MM-YYYY")
            : "dd-MM-yyyy",
        };
      });
      await generateExcel(dataToEXport, "Job Posting", "xlsx", res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finaldata, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get By ID
exports.getJobPostingByID = async (req, res, next) => {
  try {
    let { jobPostingID } = req.query;
    const jobPostingData = await JobPosting.findOne({
      where: {
        jobPostingID,
        status: 1,
      },
      include: [
        {
          model: companyMaster,
          attributes: ["companyMasterID", "companyName"],
        },
        {
          model: BranchMaster,
          attributes: ["branchMasterID", "branchName", "branchCode"],
        },
        {
          model: Department,
          attributes: ["departmentId", "departmentName"],
        },
        {
          model: Designation,
          attributes: ["designationId", "designationName"],
        },
        {
          model: JobRoleClassification,
          attributes: [
            "jobRoleClassificationID",
            "jobRoleClassificationName",
            "jobRoleClassificationDescription",
          ],
        }
      ],
    });
    return res.status(200).json({ status: 200, data: jobPostingData });
  } catch (err) {
    next(err);
  }
};

// Edit By ID
exports.editJobPosting = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      jobPostingID,
      jobTitle,
      employmentType,
      jobDescription,
      jobLocation,
      requirements,
      lastApplicableDate,
      minSalary,
      maxSalary,
      noOfPosition,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      jobRoleClassificationID,
    } = await req.body;
    if (minSalary > maxSalary) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "Max Salary Can Not be less then Min Salary",
      });
    }
    if (noOfPosition <= 0) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "No. Of Position atleast 1",
      });
    }
    if (minSalary < 0) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "Minimum Salary Can Not Be Negative",
      });
    }
    if (maxSalary < 0) {
      await transaction.rollback();
      return res.status(500).json({
        status: 500,
        message: "Maximum Salary Can Not Be Negative",
      });
    }
    await JobPosting.update(
      {
        jobPostingID,
        jobTitle,
        employmentType,
        jobDescription,
        jobLocation,
        requirements,
        lastApplicableDate,
        minSalary,
        maxSalary,
        noOfPosition,
        companyMasterID,
        branchMasterID,
        departmentId,
        designationId,
        jobRoleClassificationID,
      },
      {
        where: { jobPostingID: jobPostingID },
      },
      {
        user: req.userDetails,
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Job Posting"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

//Delete
exports.deleteJobPosting = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { jobPostingID } = req.body;

    const findData = await JobPosting.findByPk(jobPostingID);

    if (!findData) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage("Job Posting"),
      });
    }
    await findData.destroy(
      {
        user: req.userDetails,
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Job Posting"),
    });
  } catch (err) {
    await transaction.commit();
    next(err);
  }
};

// get By Post ID
exports.getJobPostingBySecrectKey = async (req, res, next) => {
  try {
    let { secretKey } = req.query;
    const jobPostingData = await JobPosting.findOne({
      where: {
        secretKey,
        status: 1,
      },
      include: [
        {
          model: companyMaster,
          attributes: ["companyMasterID", "companyName", "companyLogo"],
        },
        {
          model: BranchMaster,
          attributes: ["branchMasterID", "branchName", "branchCode"],
        },
        {
          model: Department,
          attributes: ["departmentId", "departmentName"],
        },
        {
          model: Designation,
          attributes: ["designationId", "designationName"],
        },
        {
          model: JobRoleClassification,
          attributes: [
            "jobRoleClassificationID",
            "jobRoleClassificationName",
            "jobRoleClassificationDescription",
          ],
        }
      ],
    });
    return res.status(200).json({ status: 200, data: jobPostingData });
  } catch (err) {
    next(err);
  }
};
