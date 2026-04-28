import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, useToast } from "@chakra-ui/react";
import axios from "axios";

const ScrollableChat = ({ messages, setMessages }) => {
  const { user } = ChatState();
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const toast = useToast();

  const handleDeleteMessage = async (messageId) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      await axios.delete(`/api/message/${messageId}`, config);

      // Update the messages state to show deleted message
      setMessages(
        messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, deleted: true, content: "" }
            : msg
        )
      );

      toast({
        title: "Success",
        description: "Message deleted successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete message",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => {
          const isSender = m.sender._id === user._id;
          const shouldShowAvatar =
            isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id);

          return (
            <div
              key={m._id}
              style={{
                display: "flex",
                justifyContent: isSender ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                width: "100%",
                marginTop: isSameUser(messages, m, i, user._id) ? "3px" : "10px",
                paddingRight: isSender ? "0" : "0",
              }}
              onMouseEnter={() => setHoveredMessageId(m._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {/* Avatar for receiver messages (left side) */}
              {!isSender && (
                <div style={{ marginRight: "8px" }}>
                  {shouldShowAvatar ? (
                    <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                      <Avatar
                        size="sm"
                        cursor="pointer"
                        name={m.sender.name}
                        src={m.sender.pic}
                      />
                    </Tooltip>
                  ) : (
                    <div style={{ width: "32px" }} />
                  )}
                </div>
              )}

              {/* Message Container */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "8px",
                  maxWidth: "60%",
                  flexDirection: isSender ? "row-reverse" : "row",
                }}
              >
                {/* Message Bubble */}
                <span
                  style={{
                    backgroundColor: isSender ? "#4D0099" : "#6600CC",
                    borderRadius: "20px",
                    padding: "8px 15px",
                    wordWrap: "break-word",
                    color: "#F2F2F5",
                    fontSize: "14px",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {m.deleted ? (
                    <span style={{ fontStyle: "italic", opacity: 0.7 }}>
                      This message was deleted
                    </span>
                  ) : (
                    m.content
                  )}
                </span>

                {/* Delete button for sender messages */}
                {isSender && !m.deleted && hoveredMessageId === m._id && (
                  <Tooltip label="Delete message" placement="top" hasArrow>
                    <IconButton
                      size="xs"
                      icon={<DeleteIcon />}
                      onClick={() => handleDeleteMessage(m._id)}
                      colorScheme="red"
                      variant="ghost"
                      fontSize="14px"
                      _hover={{
                        bg: "rgba(255, 0, 0, 0.2)",
                      }}
                    />
                  </Tooltip>
                )}
              </div>

              {/* Avatar for sender messages (right side) */}
              {isSender && (
                <div style={{ marginLeft: "8px" }}>
                  {shouldShowAvatar && (
                    <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                      <Avatar
                        size="sm"
                        cursor="pointer"
                        name={m.sender.name}
                        src={m.sender.pic}
                      />
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
