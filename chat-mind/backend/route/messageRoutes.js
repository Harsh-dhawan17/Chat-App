const express = require("express");
const { authentication } = require("../middleWare/auth");
const { getAllMessage, sendMessage, deleteMessage } = require("../controller/messageController");
const router = express.Router();



router.route("/:chatId").get(authentication, getAllMessage);
router.route("/").post(authentication  , sendMessage);
router.route("/:messageId").delete(authentication, deleteMessage);

module.exports = router