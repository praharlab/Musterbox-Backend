const Sequelize = require('sequelize');
const UserAddress = require('../models/userAddress');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const CityMaster = require('../models/citymaster');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const DistrictMaster = require('../models/districtMaster');
const { convertNameToLocalName } = require('../utils/labelUtils');
const { Translate } = require('@google-cloud/translate').v2;

exports.postAddUserAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      addressType,
      houseNumber,
      houseName,
      landmark,
      area,
      cityMasterID,
      zipcode,
      verifyStatus,
      verifyBy,
      districtID,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const address_exists = await UserAddress.findAll({
      where: {
        userMasterID: userMasterID,
        addressType: addressType,
      },
      transaction,
    });
    const PromiseArray = [];
    if (address_exists && address_exists.length > 0) {
      PromiseArray.push(
        UserAddress.update(
          {
            status: 0,
            updateBy,
            updateByIp,
          },
          {
            where: {
              userMasterID: userMasterID,
              addressType: addressType,
              status: [1, 0],
            },
          },
          { transaction }
        )
      );
    }
    let localLangAddress = null;

    if (convertNameToLocalName) {
      const findUserCompany = await UserMaster.findOne({
        where: {
          userMasterID,
        },
        attributes: ['companyMasterId'],
      });
      if (
        findUserCompany.companyMasterId == 744 ||
        findUserCompany.companyMasterId == 965 ||
        findUserCompany.companyMasterId == 968 ||
        findUserCompany.companyMasterId == 969 ||
        findUserCompany.companyMasterId == 970 ||
        findUserCompany.companyMasterId == 971 ||
        findUserCompany.companyMasterId == 998 ||
        findUserCompany.companyMasterId == 999 ||
        findUserCompany.companyMasterId == 1000
      ) {
        try {
          let formatedAddress = '';
          formatedAddress += `${houseNumber},`;
          formatedAddress += `${houseName},`;
          formatedAddress += `${landmark},`;
          formatedAddress += `${area},`;

          if (cityMasterID) {
            const cityWiseData = await CityMaster.findOne({
              where: { cityMasterID: cityMasterID },
              attributes: ['cityName'],
              include: [
                {
                  required: true,
                  model: StateMaster,
                  attributes: ['stateName'],
                  include: [
                    {
                      required: true,
                      model: CountryMaster,
                      attributes: ['countryName'],
                    },
                  ],
                },
              ],
            });
            formatedAddress += `${cityWiseData.cityName},`;
            formatedAddress += `${cityWiseData.stateMaster.stateName},`;
            formatedAddress += `${cityWiseData.stateMaster.countryMaster.countryName}, `;
          }
          formatedAddress += `${zipcode}`;
          const translate = new Translate({
            key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
          });

          const response = await translate.translate([formatedAddress], {
            from: 'en', // Explicitly specify English as the source
            to: 'mr',
            format: 'text',
            model: 'base',
          });

          // Extract transliterated values
          localLangAddress = response[0]?.[0] || null;
        } catch (error) {
          console.error('Error in translation:', error);
        }
      }
    }

    PromiseArray.push(
      UserAddress.create(
        {
          userMasterID,
          addressType,
          houseNumber,
          houseName,
          landmark,
          area,
          cityMasterID: cityMasterID ? cityMasterID : null,
          zipcode,
          createBy: updateBy,
          createByIp: updateByIp,
          verifyStatus,
          verifyBy,
          districtID: districtID ? districtID : null,
          localLangAddress,
        },
        { transaction }
      )
    );

    await Promise.all(PromiseArray);
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Address'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getUserAddressById = async (req, res, next) => {
  try {
    const get_one_data = await UserAddress.findOne({
      where: {
        userAddressID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
        },
        {
          model: CityMaster,
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
            },
          ],
        },
        {
          required: false,
          model: DistrictMaster,
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getUserAddressByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await UserAddress.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: CityMaster,
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
            },
          ],
        },
        {
          required: false,
          model: DistrictMaster,
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
            },
          ],
        },
      ],
    });

    for (var i = 0; i < get_one_data.length; i++) {
      let getCreatedby = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].createBy,
        },
        attributes: ['displayName'],
      });
      get_one_data[i].createBy = getCreatedby ? getCreatedby.displayName : '';

      let verifyBy = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].verifyBy,
        },
        attributes: ['displayName'],
      });
      get_one_data[i].verifyBy = verifyBy ? verifyBy.displayName : '';
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateUserAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userAddressID,
      addressType,
      houseNumber,
      houseName,
      landmark,
      area,
      cityMasterID,
      zipcode,
      verifyStatus,
      districtID,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    if (convertNameToLocalName) {
      const getuserAddressData = await UserAddress.findOne({
        where: {
          userAddressID,
        },
      });
      const findUserCompany = await UserMaster.findOne({
        where: {
          userMasterID: getuserAddressData.userMasterID,
        },
        attributes: ['companyMasterId'],
      });
      if (
        findUserCompany.companyMasterId == 744 ||
        findUserCompany.companyMasterId == 965 ||
        findUserCompany.companyMasterId == 968 ||
        findUserCompany.companyMasterId == 969 ||
        findUserCompany.companyMasterId == 970 ||
        findUserCompany.companyMasterId == 971 ||
        findUserCompany.companyMasterId == 998 ||
        findUserCompany.companyMasterId == 999 ||
        findUserCompany.companyMasterId == 1000
      ) {
        try {
          let formatedAddress = '';
          formatedAddress += `${houseNumber},`;
          formatedAddress += `${houseName},`;
          formatedAddress += `${landmark},`;
          formatedAddress += `${area},`;

          if (cityMasterID) {
            const cityWiseData = await CityMaster.findOne({
              where: { cityMasterID: cityMasterID },
              attributes: ['cityName'],
              include: [
                {
                  required: true,
                  model: StateMaster,
                  attributes: ['stateName'],
                  include: [
                    {
                      required: true,
                      model: CountryMaster,
                      attributes: ['countryName'],
                    },
                  ],
                },
              ],
            });
            formatedAddress += `${cityWiseData.cityName},`;
            formatedAddress += `${cityWiseData.stateMaster.stateName},`;
            formatedAddress += `${cityWiseData.stateMaster.countryMaster.countryName}`;
          }
          formatedAddress += ` ${zipcode}`;
          const translate = new Translate({
            key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
          });

          const response = await translate.translate([formatedAddress], {
            from: 'en', // Explicitly specify English as the source
            to: 'mr',
            format: 'text',
            model: 'base',
          });

          // Extract transliterated values
          localLangAddress = response[0]?.[0] || null;
        } catch (error) {
          console.error('Error in translation:', error);
        }
      }
    }
    await UserAddress.update(
      {
        addressType,
        houseNumber,
        houseName,
        landmark,
        area,
        cityMasterID: cityMasterID ? cityMasterID : null,
        zipcode,
        updateBy,
        updateByIp,
        verifyStatus,
        districtID: districtID ? districtID : null,
      },
      {
        where: { userAddressID: userAddressID },
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Address'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { userAddressID, status } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    await UserAddress.update(
      {
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { userAddressID: userAddressID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('User Address')
          : message.usermessage.deactiveMessage('User Address'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteUserAddressById = async (req, res, next) => {
  try {
    let { userAddressID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await UserAddress.update(
      {
        status: 2,
        updateBy,
        updateByIp,
      },
      {
        where: { userAddressID: userAddressID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Address'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddVerifyRequest = async (req, res, next) => {
  try {
    const { userAddressID, verifyStatus, verifyBy, rejectionRemarks } =
      req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const updateStatus = await UserAddress.update(
      { verifyStatus, verifyBy, rejectionRemarks, updateBy, updateByIp },
      {
        where: { userAddressID },
      }
    );
    return res.status(200).json({
      status: 200,
      message: 'Verification status updated successfully.',
      data: updateStatus,
    });
  } catch (err) {
    next(err);
  }
};
