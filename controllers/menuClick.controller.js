const FormMaster = require("../models/formMaster");
const menuClick = require("../models/menuClick");
const RoleMaster = require("../models/roleMaster");
const RolePermission = require("../models/rolePermission");
const UserMaster = require("../models/userMaster");
const UserRole = require("../models/userRole");
const message = require("../response_message/message");


exports.addMenuClick = async (req, res, next) => {
    try {
        const { userMasterID, formMasterID } = req.body;

        if(!userMasterID || !formMasterID){
            return res.status(200).json({
                status: 401,
                message: message.usermessage.ValidParameters
            })
        }

        const data = await menuClick.findOne({
            where: {
                userMasterID: userMasterID,
                formMasterID: formMasterID,
            }
        });

        if (!data || data == null) {
            await menuClick.create({ userMasterID, formMasterID }, { user: req.userDetails });
        } else {
            data.counter++;
            await data.save({ user: req.userDetails },);
        }

        return res.status(200).json({ message: message.usermessage.addMessage('Menu Click'), status: 200 })

    } catch (error) {
        next(error);
    }
}

exports.getRecentMenus = async (req, res, next) => {
    try {
        const userMasterID = req.params.id;
        const userRole = await UserRole.findOne({
            where: {
                userMasterID,
            },
            include: [
                {
                    model: RoleMaster,
                    attributes: ['roleMasterID'],
                    include: [
                        {
                            model: RolePermission,
                            attributes: ['rolePermissionID'],
                            include: [
                                {
                                    model: FormMaster,
                                    attributes: ['formMasterID', 'icon', ['formName', 'menu'], 'path']
                                }
                            ],
                        }
                    ]
                }
            ]
        });

        const formMasterIDs = userRole.roleMaster.rolePermissions.map((x) => x.formMaster.formMasterID);
        const data = await menuClick.findAll({
            where: {
                userMasterID: userMasterID,
                formMasterID: formMasterIDs
            },
            order: [['updatedAt', 'DESC']],
            limit: 3,
            attributes: [],
            include: [
                {
                    model: FormMaster,
                    attributes: ['formMasterID', 'icon', ['formName', 'menu'], 'path']
                }
            ]
        });

        return res.status(200).json({
            data: data,
            status: 200
        })
    } catch (error) {
        next(error);
    }
}