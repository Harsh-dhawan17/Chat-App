const asyncWrapper = require("../middleWare/asyncWrapper");
const messageModel = require("../model/MessageModel");
const chatModel = require("../model/ChatModel");
const ErrorHandler = require("../appUtills/error");
const userModel = require("../model/UserModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected

exports.getAllMessage = asyncWrapper(async (req, res, next) => {
  const messages = await messageModel
    .find({ chat: req.params.chatId })
    .populate("sender", "name pic email")
    .populate("chat");

  if (!messages) {
    return next(new ErrorHandler("Chat id not found", 404));
  }
 res.json(messages);
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected

exports.sendMessage = asyncWrapper(async (req, res, next) => {
  const { content, chatId } = req.body;



  if (!content || !chatId) {
    return next(new ErrorHandler("Invalid data passed into request", 400));
  }

  let newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  let message = await messageModel.create(newMessage);
  message = await message.populate("sender", "name pic");
  message = await message.populate("chat");
  message = await userModel.populate(message, {
    path: "chat.users",
    select: "name pic email",
  });


  // now update lastest message  beacuse when user communicate everytime lastest message will change
  await chatModel.findByIdAndUpdate(req.body.chatId, {
    latestMessage: message,
  });

    res.json(message);

});

//@description     Delete a Message
//@route           DELETE /api/message/:messageId
//@access          Protected

exports.deleteMessage = asyncWrapper(async (req, res, next) => {
  const { messageId } = req.params;

  if (!messageId) {
    return next(new ErrorHandler("Message ID is required", 400));
  }

  const message = await messageModel.findById(messageId);

  if (!message) {
    return next(new ErrorHandler("Message not found", 404));
  }

  // Only the sender can delete their own message
  if (message.sender.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You can only delete your own messages", 403));
  }

  // Mark message as deleted
  const deletedMessage = await messageModel.findByIdAndUpdate(
    messageId,
    {
      deleted: true,
      deletedAt: new Date(),
      content: "", // Clear the content
    },
    { new: true }
  );

  res.json(deletedMessage);
});
