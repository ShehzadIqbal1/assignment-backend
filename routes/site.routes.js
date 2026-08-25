const express = require("express");

const router = express.Router();

const { getSiteConfig } = require("../controllers/site.controller");

router.get("/config", getSiteConfig);

module.exports = router;
