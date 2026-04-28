const asyncWrapper = require("../middleWare/asyncWrapper");
const callModel = require("../model/CallModel");
const ErrorHandler = require("../appUtills/error");

//@description     Get call history
//@route           GET /api/call/:chatId
//@access          Protected

exports.getCallHistory = asyncWrapper(async (req, res, next) => {
  const { chatId } = req.params;

  const calls = await callModel
    .find({ chat: chatId })
    .populate("caller", "name pic")
    .populate("receiver", "name pic")
    .sort({ createdAt: -1 });

  res.json(calls);
});

//@description     Create new call record
//@route           POST /api/call/
//@access          Protected

exports.initiateCall = asyncWrapper(async (req, res, next) => {
  const { receiverId, chatId, callType } = req.body;

  if (!receiverId || !chatId) {
    return next(new ErrorHandler("Invalid data passed into request", 400));
  }

  const newCall = {
    caller: req.user._id,
    receiver: receiverId,
    chat: chatId,
    callStatus: "initiated",
    callType: callType || "audio",
    startTime: new Date(),
  };

  const call = await callModel.create(newCall);
  const populatedCall = await call
    .populate("caller", "name pic")
    .populate("receiver", "name pic");

  res.json(populatedCall);
});

//@description     End call
//@route           PUT /api/call/:callId
//@access          Protected

exports.endCall = asyncWrapper(async (req, res, next) => {
  const { callId } = req.params;
  const { duration } = req.body;

  if (!callId) {
    return next(new ErrorHandler("Call ID is required", 400));
  }

  const call = await callModel.findByIdAndUpdate(
    callId,
    {
      callStatus: "ended",
      endTime: new Date(),
      duration: duration || 0,
    },
    { new: true }
  );

  if (!call) {
    return next(new ErrorHandler("Call not found", 404));
  }

  res.json(call);
});
