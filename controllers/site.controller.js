const SiteConfig = require("../models/SiteConfig");

const getSiteConfig = async (req, res) => {
  const { tag } = req.query;

  if (!tag) {
    return res.status(400).json({
      success: false,
      message: "Website tag is required",
    });
  }

  const config = await SiteConfig.findOne({
    tag: tag.toLowerCase(),
  });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: "Site configuration not found",
    });
  }

  return res.status(200).json({
    success: true,

    data: {
      tag: config.tag,
      activeHome: config.activeHome,
    },
  });
};

module.exports = {
  getSiteConfig,
};
