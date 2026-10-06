const express = require("express");

// import user controller
const {createUser , getUser , baseRoute , getUserById , updateUser , deleteUser} = require("../controllers/user.controller")

// created router
const router = express.Router();


// router.get("/" , baseRoute);

// CREATE
router.post("/" , createUser);

// READ ALL
router.get("/", getUser);

// READ ONE
router.get("/:id" , getUserById);

// UPDATE
router.put("/:id" , updateUser );

// DELETE USER
router.delete("/:id" , deleteUser);


module.exports = router;