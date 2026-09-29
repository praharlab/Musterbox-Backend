const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const tdsSubSection = require("../models/tdsSubSection");
const TdsSubSectionLimit = require("../models/tdsSubsectionLimit");
const { usermessage } = require("../response_message/message");
const tdsSection = require("../models/tdsSection");
const TdsSubSectionCategory = require("../models/tdsSubSectionCategory");
const { generateExcel } = require("../utils/exportData");

exports.addData = async (req, res, next) => {
    try {
        const { tdsSubSectionID, maxLimit, applicableYYYYMM } = req.body;

        if (!tdsSubSectionID || !maxLimit || !applicableYYYYMM) {
            return res.status(200).json({
                status: 401,
                message: usermessage.ValidParameters,
            });
        }

        if (+maxLimit <= 0) {
            return res.status(200).json({
                status: 401,
                message:
                    "Only positive values are allowed.",
            });
        }

        const data = await TdsSubSectionLimit.findOne({
            where: {
                tdsSubSectionID,
                applicableYYYYMM,
            },
        });

        if (data) {
            return res.status(200).json({
                status: 401,
                message:
                    "A limit has already been added for this TDS sub-section and applicable month.",
            });
        }

        await TdsSubSectionLimit.create(
            {
                tdsSubSectionID,
                maxLimit,
                applicableYYYYMM,
            },
            {
                user: req.userDetails,
            }
        );

        return res.status(200).json({
            status: 200,
            message: usermessage.addMessage("TDS Sub Section Limit"),
        });
    } catch (error) {
        next(error);
    }
};

exports.updateData = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { maxLimit, applicableYYYYMM } = await req.body;

        const data = await TdsSubSectionLimit.findByPk(id);

        if (!data) {
            return res.status(200).json({
                status: 401,
                message: usermessage.notFoundMessage("TDS Sub Section Limit"),
            });
        }

        if (+maxLimit <= 0) {
            return res.status(200).json({
                status: 401,
                message:
                    "Only positive values are allowed.",
            });
        }

        const alreadyData = await TdsSubSectionLimit.findOne({
            where: {
                tdsSubSectionID: data.tdsSubSectionID,
                applicableYYYYMM,
                id: {
                    [Sequelize.Op.ne]: data.id
                }
            },
        });

        if (alreadyData) {
            return res.status(200).json({
                status: 401,
                message:
                    "A limit has already been added for this TDS sub-section and applicable month.",
            });
        }

        data.maxLimit = maxLimit;
        data.applicableYYYYMM = applicableYYYYMM;

        await data.save({ user: req.userDetails });

        return res.status(200).json({
            status: 200,
            message: usermessage.updateMessage("TDS Sub Section Limit"),
        });
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const data = await TdsSubSectionLimit.findOne({
            where: {
                id,
            },
            include: [
                {
                    model: tdsSubSection,
                    attributes: [
                        "tdsSubSectionName",
                        "tdsSectionID",
                        "tdsSubSectionCategoryID",
                    ],
                    include: [
                        {
                            model: tdsSection,
                            attributes: ["tdsSectionName"],
                        },
                        {
                            model: TdsSubSectionCategory,
                            attributes: ["categoryName"],
                        },
                    ],
                },
            ],
        });

        if (!data) {
            return res.status(200).json({
                status: 401,
                message: "No data found",
            });
        }

        return res.status(200).json({
            status: 200,
            data: data,
        });
    } catch (error) {
        next(error);
    }
};

exports.getlist = async (req, res, next) => {
    try {
        const {
            page,
            limit,
            searchQuery,
            tdsSubSectionID,
            tdsSectionID,
            tdsSubSectionCategoryID,
            Export,
        } = await req.query;

        const paginate =
            !Export && page && limit
                ? { offset: (page - 1) * limit, limit: limit }
                : {};

        const condition = {};

        if (tdsSubSectionID) condition.tdsSubSectionID = tdsSubSectionID;
        if (tdsSectionID) condition["$tdsSubSection.tdsSectionID$"] = tdsSectionID;
        if (tdsSubSectionCategoryID)
            condition["$tdsSubSection.tdsSubSectionCategoryID$"] =
                tdsSubSectionCategoryID;

        if (searchQuery) {
            condition[Sequelize.Op.or] = [
                {
                    "$tdsSubSection.tdsSubSectionName$": {
                        [Sequelize.Op.iLike]: `%${searchQuery}%`,
                    },
                },
                {
                    "$tdsSubSection.tdsSection.tdsSectionName$": {
                        [Sequelize.Op.iLike]: `%${searchQuery}%`,
                    },
                },
                {
                    "$tdsSubSection.tdsSubSectionCategory.categoryName$": {
                        [Sequelize.Op.iLike]: `%${searchQuery}%`,
                    },
                },
            ];
        }

        const { rows: data, count: totalcount } =
            await TdsSubSectionLimit.findAndCountAll({
                where: condition,
                ...paginate,
                include: [
                    {
                        model: tdsSubSection,
                        attributes: [
                            "tdsSubSectionName",
                            "tdsSectionID",
                            "tdsSubSectionCategoryID",
                        ],
                        include: [
                            {
                                model: tdsSection,
                                attributes: ["tdsSectionName"],
                            },
                            {
                                model: TdsSubSectionCategory,
                                attributes: ["categoryName"],
                            },
                        ],
                    },
                ],
                order: [["applicableYYYYMM", "DESC"]],
            });

        if (Export) {
            const finalData = [];
            for (let item of data) {
                let tempObj = {
                    "TDS Subsection Name": item.tdsSubSection?.tdsSubSectionName || "",
                    "TDS Section Name":
                        item.tdsSubSection?.tdsSection?.tdsSectionName || "",
                    "TDS Sub Section Category":
                        item.tdsSubSection?.tdsSubSectionCategory?.categoryName,
                    "Limit ApplicableYYYYMM": item.applicableYYYYMM,
                    "Max Limit": item.maxLimit,
                };
                finalData.push(tempObj);
            }
            return await generateExcel(
                finalData,
                "TDS Sub Section Limit",
                "xlsx",
                res
            );
        }

        return res.status(200).json({
            status: 200,
            data: data,
            totalcount: totalcount,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const data = await TdsSubSectionLimit.findByPk(id);

        if (!data) {
            return res.status(200).json({
                status: 401,
                message: usermessage.notFoundMessage("TDS Sub Section Limit"),
            });
        }

        await data.destroy();

        return res.status(200).json({
            status: 200,
            message: usermessage.deleteMessage("TDS Sub Section Limit"),
        });
    } catch (error) {
        next(error);
    }
};

exports.addLimitData = async (req, res, next) => {
    try {

        const allData = await tdsSubSection.findAll({
            where: {
                status: 1,
                maxLimit: {
                    [Sequelize.Op.and]: [
                        { [Sequelize.Op.ne]: null },
                        { [Sequelize.Op.gt]: 0 }
                    ]
                }
            }
        });

        const finalData = [];

        for (const data of allData) {
            finalData.push({
                applicableYYYYMM: 202304,
                maxLimit: data.maxLimit,
                tdsSubSectionID: data.tdsSubSectionID
            });
        }

        await TdsSubSectionLimit.bulkCreate(finalData, { individualHooks: true, user: req.userDetails });

        return res.status(200).json({
            status: 200,
            message: 'Data added successfully.'
        })

    } catch (error) {
        next(error);
    }
}
