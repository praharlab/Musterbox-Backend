const { Sequelize } = require("sequelize");
const sequelize = require('../config/database');
const message = require('../response_message/message');
const trackingOutageCategoryDetails = require("../models/trackingCategoryDetails");
const trackingOutageCategory = require("../models/trackingOutageCategory");


exports.getTrackingCategoryDetails = async(req, res, next) => {
    try {
        const { page, limit } = req.body;
        let paginationQuery = {}

        if (page && limit) {
            paginationQuery.limit = limit;
            paginationQuery.offset = (page - 1) * limit;
        }

        const { rows, count } = await trackingOutageCategoryDetails.findAndCountAll({
            ...paginationQuery,
            order: [['createdAt', 'ASC']],
            include: [{
                model: trackingOutageCategory
            }]
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

exports.addTrackingCategoryDetail = async(req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {trackingCategoryID, title, description} = req.body;

        const existData = await trackingOutageCategoryDetails.findOne({
            where: {
                [Sequelize.Op.and]: [
                    sequelize.where(
                        sequelize.fn(
                            'TRIM',
                            sequelize.fn('LOWER', sequelize.col('title'))
                        ),
                        title.trim().toLowerCase()
                    )
                ],
            }
        }, {transaction})

        if (existData) {
            await transaction.rollback()
            return res.status(400).json({
                status: 400,
                message: message.usermessage.trackingCategoryDetailExist
            })
        }
       
        await trackingOutageCategoryDetails.create({trackingCategoryID, title, description }, {user: req.userDetails, transaction})
        
        await transaction.commit()

        return res.status(200).json({
            status: 200,
            message: message.usermessage.trackingCategoryDetailAdd
        })
        
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}

exports.updateTrackingDetail = async(req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {categoryDetailsID, title, description} = req.body;

        const existData = await trackingOutageCategoryDetails.findOne({
            where: {
                [Sequelize.Op.and]: [
                    sequelize.where(
                        sequelize.fn(
                            'TRIM',
                            sequelize.fn('LOWER', sequelize.col('title'))
                        ),
                        title.trim().toLowerCase()
                    ),
                    {categoryDetailsID: {[Sequelize.Op.ne]: categoryDetailsID}}
                ],
            },
            transaction
        })
    
        if(existData){
            await transaction.rollback()
            return res.status(400).json({
                status: 400,
                message: message.usermessage.trackingCategoryDetailExist
            })
        }

        const change_data = await trackingOutageCategoryDetails.findOne({where: {categoryDetailsID}, transaction});

        change_data.title = title;
        change_data.description = description;

        await change_data.save({
            user: req.userDetails,
            transaction
        })

        await transaction.commit()

        return res.status(200).json({
            status: 200,
            message: message.usermessage.trackingCategoryDetailUpdate
        })

    } catch (error) {
        await transaction.rollback()
        next(error)
    }
}

exports.deleteTrackingDetail = async(req, res, next) => {
    try {
        const categoryDetailsID = req.params.id;

        await trackingOutageCategoryDetails.destroy({where: {categoryDetailsID}}, {user: req.userDetails});

        return res.status(200).json({
            status: 200,
            message: message.usermessage.trackingCategoryDetailDelete
        })

    } catch (error) {
        next(error)
    }
}

exports.getTrackingCategoryDetailsById = async(req, res, next) => {
    try {
        const categoryDetailsID = req.params.id;

        const trackingDetails = await trackingOutageCategoryDetails.findOne({
            where: {categoryDetailsID},
            include: [{
                model: trackingOutageCategory
            }]
        });

        return res.status(200).json({
            status: 200,
            data: trackingDetails
        })

    } catch (error) {
        next(error)
    }
}

exports.updateTrackingOutageCategoryDetailsStatus = async(req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {categoryDetailsID, status} = req.body;
        const change_data = await trackingOutageCategoryDetails.findOne({where: {categoryDetailsID}, transaction});

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