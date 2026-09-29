const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const trackingOutageCategory = require('../models/trackingOutageCategory');

exports.getTrackingOutageCategory = async (req, res, next) => {
    try {
        const { page, limit } = req.body;
        let paginationQuery = {}

        if (page && limit) {
            paginationQuery.limit = limit;
            paginationQuery.offset = (page - 1) * limit;
        }

        const { rows, count } = await trackingOutageCategory.findAndCountAll({
            ...paginationQuery,
            include: [{
                model: UserMaster,
                attributes: ['displayName']
            }],
            order: [['createdAt', 'ASC']],
        });

        return res.status(200).json({
            data: rows,
            totalcount: count,
            status: 200
        })
    } catch (error) {
        next(error);
    }
}

exports.addTrackingOutageCategory = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {categoryName} = req.body;

        const existData = await trackingOutageCategory.findOne({
            where: {
                [Sequelize.Op.and]: [
                    sequelize.where(
                        sequelize.fn(
                            'TRIM',
                            sequelize.fn('LOWER', sequelize.col('categoryName'))
                        ),
                        categoryName.trim().toLowerCase()
                    )
                ],
            }
        }, {transaction})

        if(existData){
            await transaction.rollback()
            return res.status(400).json({
                status: 400,
                message: message.usermessage.trackingOutageCategoryExist
            })
        }

        await trackingOutageCategory.create({categoryName}, {transaction, user: req.userDetails})

        await transaction.commit()

        res.status(200).json({
            status: 200,
            message: message.usermessage.trackingOutageCategoryAdd
        })
        
    } catch (error) {
        await transaction.rollback()
        next(error)
    }
}

exports.updateTrackingOutageCategory = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { trackingCategoryID, categoryName } = req.body;
        const existData = await trackingOutageCategory.findOne({
            where: {
                [Sequelize.Op.and]: [
                    sequelize.where(
                        sequelize.fn(
                            'TRIM',
                            sequelize.fn('LOWER', sequelize.col('categoryName'))
                        ),
                        categoryName.trim().toLowerCase()
                    ),
                    {trackingCategoryID: {[Sequelize.Op.ne]: trackingCategoryID}}
                ],
            },
            transaction
        })
    
        if(existData){
            await transaction.rollback()
            return res.status(400).json({
                status: 400,
                message: message.usermessage.trackingOutageCategoryExist
            })
        }

        let change_data;

        change_data = await trackingOutageCategory.findOne({where: {trackingCategoryID}})

        change_data.categoryName = categoryName;

        await change_data.save({
            user: req.userDetails,
            transaction
        })

        await transaction.commit()
        
        return res.status(200).json({
            status: 200,
            message: message.usermessage.trackingOutageCategoryUpdate
        })
    } catch (error) {
        await transaction.rollback()
        next(error)
    }
}

exports.deleteTrackingOutageCategory = async(req, res, next) => {
    try {
        const trackingCategoryID = req.params.id;

        await trackingOutageCategory.destroy({
            where: {
                trackingCategoryID
            }
        },{
            user: req.userDetails
        })

        return res.status(200).json({
            status: 200,
            message: message.usermessage.trackingOutageCategoryDelete
        })
    } catch (error) {
        next(error)
    }
}

exports.getTrackingOutageCategoryById = async(req, res, next) => {
    try {
        const trackingCategoryID = req.params.id;

        const trackingOutageCategoryData = await trackingOutageCategory.findOne({where: {trackingCategoryID}});

        return res.status(200).json({
            status: 200,
            data: trackingOutageCategoryData
        })
        
    } catch (error) {
        next(error)
    }
}

exports.updateTrackingOutageCategoryStatus = async(req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {trackingCategoryID, status} = req.body;
        const change_data = await trackingOutageCategory.findOne({where: {trackingCategoryID}, transaction});

        change_data.status = status;

        await change_data.save({
            user: req.userDetails,
            transaction
        })

        await transaction.commit()
        return res.status(200).json({
            status: 200,
            message: message.usermessage.trackingOutageCategoryStatusUpdate
        })

    } catch (error) {
        await transaction.rollback()
        next(error)
    }
}