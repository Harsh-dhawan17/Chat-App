const express = require("express");
const { authentication } = require("../middleWare/auth");
const { getCallHistory, initiateCall, endCall } = require("../controller/callController");
const router = express.Router();

router.route("/:chatId").get(authentication, getCallHistory);
router.route("/").post(authentication, initiateCall);
router.route("/:callId").put(authentication, endCall);

module.exports = router;
