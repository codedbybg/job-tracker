const express = require("express");

// import user controller
const {createUser , getUser , baseRoute} = require("../controllers/user.controller")

// created router
const router = express.Router();


router.get("/" , baseRoute);

router.post("/" , createUser);
router.get("/", getUser);


module.exports = router;