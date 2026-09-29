const PreboardingCustomizeFieldValue = require('../models/preboardingformcustomizevalue');
const PreboardingFormCustomize = require('../models/preboardingformcustomize');

exports.getPreboardingIDCustomizeFieldValueById = async (req, res, next) => {
  try {
    const get_one_data = await PreboardingCustomizeFieldValue.findAll({
      where: {
        preboardingID: req.params.id,
      },
      include: [{ model: PreboardingFormCustomize }],
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
