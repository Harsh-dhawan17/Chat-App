import { FormControl } from "@chakra-ui/form-control";
import {
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import Send from "@mui/icons-material/Send";
import {  Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast, useDisclosure } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import { Player } from "lottie-react";
import EmojiOptions from "./EmojiOptions";
import animationData from "../animations/typing.json";
import backgroundImage from "../img/img.jpg";
import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import CallButton from "./CallButton";
import IncomingCallModal from "./IncomingCallModal";
import CallInterfaceWithRTC from "./CallInterfaceWithRTC";

const ENDPOINT = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://chat-mind-production.up.railway.app/";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // "audio" or "video"
  const [callDuration, setCallDuration] = useState("00:00");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);
  
  const {
    isOpen: isIncomingCallOpen,
    onOpen: onIncomingCallOpen,
    onClose: onIncomingCallClose,
  } = useDisclosure();
  
  const {
    isOpen: isCallInterfaceOpen,
    onOpen: onCallInterfaceOpen,
    onClose: onCallInterfaceClose,
  } = useDisclosure();

  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const [showEmojiOptions, setShowEmojiOptions] = useState(false);

  const handleEmojiClick = (emoji) => {
    setNewMessage((prevMessage) => prevMessage + emoji);
  };

  const handleToggleEmojiOptions = () => {
    setShowEmojiOptions((prevState) => !prevState);
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
         "Content-type": "application/json",
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

 
// sendMessage is used to send message on clicking send button or pressing Enter
  const sendMessage = async (event) => {
    // Check if it's a keyboard event with Enter key OR a click event
    const isEnterKey = event.key === "Enter";
    const isClickEvent = event.type === "click";

    if (newMessage && (isEnterKey || isClickEvent)) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
          },
        };

        setNewMessage("");

        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // Call event listeners
    socket.on("incoming call", (callData) => {
      setIncomingCall(callData);
      onIncomingCallOpen();
    });

    socket.on("call answered", (callData) => {
      setCallActive(true);
      onCallInterfaceOpen();
    });

    socket.on("call rejected", (callData) => {
      toast({
        title: "Call Rejected",
        description: "The user rejected your call",
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    });

    socket.on("call ended", (callData) => {
      setCallActive(false);
      onCallInterfaceClose();
      setCallStartTime(null);
      setCallDuration("00:00");
    });

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callActive && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - callStartTime) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setCallDuration(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callActive, callStartTime]);

  // Call handler functions
  const initiateCall = (type) => {
    if (!selectedChat || selectedChat.isGroupChat) {
      toast({
        title: "Error",
        description: "Cannot call in group chats",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    const receiverId = selectedChat.users.find(
      (u) => u._id !== user._id
    )?._id;

    if (!receiverId) {
      toast({
        title: "Error",
        description: "Could not find receiver",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    setCallType(type);
    setCallActive(true);
    setCallStartTime(new Date());
    onCallInterfaceOpen();

    socket.emit("initiate call", {
      receiverId,
      callerId: user._id,
      callerName: user.name,
      callerPic: user.pic,
      callType: type,
    });
  };

  const handleAcceptCall = () => {
    setCallType(incomingCall?.callType || "audio");
    setCallActive(true);
    setCallStartTime(new Date());
    
    socket.emit("call accepted", {
      callerId: incomingCall?.callerId,
      receiverId: user._id,
    });

    onIncomingCallClose();
    onCallInterfaceOpen();
  };

  const handleRejectCall = () => {
    socket.emit("call rejected", {
      callerId: incomingCall?.callerId,
      receiverId: user._id,
    });
    setIncomingCall(null);
    onIncomingCallClose();
  };

  const handleEndCall = async () => {
    const receiverId = selectedChat.users.find(
      (u) => u._id !== user._id
    )?._id;

    socket.emit("end call", {
      callerId: user._id,
      receiverId,
    });

    setCallActive(false);
    setCallStartTime(null);
    setCallDuration("00:00");
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            fontWeight={800}
              textShadow="2px 2px 8px rgba(0, 0, 0, 0.6)"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          
            
          >
            <IconButton
              bg="linear-gradient(147.14deg, #FF3B3B 6.95%, #6600CC 93.05%);"
              color="#F2F2F5"
              _hover={{ bg: "#6600CC" }}
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  <div style={{ flex: 1 }}>{getSender(user, selectedChat.users)}</div>
                  <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <CallButton
                      onAudioCall={() => initiateCall("audio")}
                      onVideoCall={() => initiateCall("video")}
                      isDisabled={callActive}
                    />
                    <ProfileModal
                      user={getSenderFull(user, selectedChat.users)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>{selectedChat.chatName.toUpperCase()}</div>
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg={`url(${backgroundImage})`}
            bgSize="cover"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} setMessages={setMessages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div style={{ marginBottom: 15, marginLeft: 0 }}>
                  <Player
                    autoplay
                    loop
                    src={animationData}
                    style={{ height: 70, width: 70 }}
                  />
                </div>
              ) : (
                <></>
              )}

              <InputGroup>
                <Input
                  variant="filled"
                  bg="#28293D"
                  placeholder="Enter a message.."
                  value={newMessage}
                  color="#F2F2F5"
                  _placeholder={{ color: "#F2F2F5" }}
                  _hover={{ bg: "#1C1C28" }}
                  onChange={typingHandler}
                  _focus={{
                    bg: "#1C1C28",
                  }}
                  pr="4rem"
                  pb="0" 
                 
                />
                <InputRightElement width="4rem">
                  <IconButton
                    icon={<EmojiEmotionsIcon />}
                    onClick={handleToggleEmojiOptions}
                    aria-label="Open Emoji Options"
                    bg="none"
                    _hover={{ bg: "none" }}
                    color="linear-gradient(147.14deg, #FF3B3B 6.95%, #6600CC 93.05%)"
                  />
                  <IconButton
                    icon={<Send />}
                    onClick={sendMessage}
                    aria-label="Send Message"
                    bg="none"
                    _hover={{ bg: "none" }}
                    color="linear-gradient(147.14deg, #FF3B3B 6.95%, #6600CC 93.05%)"
                  />
                </InputRightElement>
              </InputGroup>
              {showEmojiOptions && (
                <EmojiOptions handleEmojiClick={handleEmojiClick} />
              )}
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}

      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={isIncomingCallOpen}
        onClose={onIncomingCallClose}
        callerData={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {/* Call Interface with WebRTC */}
      <CallInterfaceWithRTC
        isOpen={isCallInterfaceOpen}
        onClose={onCallInterfaceClose}
        callType={callType}
        otherUserData={
          selectedChat &&
          !selectedChat.isGroupChat &&
          getSenderFull(user, selectedChat.users)
        }
        onEndCall={handleEndCall}
        callDuration={callDuration}
        socket={socket}
        userId={user._id}
      />
    </>
  );
};

export default SingleChat;
