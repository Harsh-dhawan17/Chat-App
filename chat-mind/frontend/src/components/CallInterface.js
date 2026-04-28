import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Avatar,
  Text,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";

const CallInterface = ({
  isOpen,
  onClose,
  callType,
  otherUserData,
  onEndCall,
  callDuration,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === "video");

  useEffect(() => {
    if (isOpen && callType === "video") {
      // Request user media
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accessing media devices:", err));
    } else if (isOpen && callType === "audio") {
      // For audio only, just get audio
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Audio is working
        })
        .catch((err) => console.error("Error accessing audio:", err));
    }

    return () => {
      // Stop all tracks when component unmounts
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [isOpen, callType]);

  const handleEndCall = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
    onEndCall();
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  if (callType === "video") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="full" closeOnOverlayClick={false}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.95)" />
        <ModalContent
          bg="#000"
          m={0}
          maxW="100%"
          h="100vh"
          borderRadius={0}
          position="relative"
        >
          <ModalBody p={0} position="relative" w="100%" h="100%">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                backgroundColor: "#000",
              }}
              playsInline
            />

            {/* Local Video */}
            <Box
              position="absolute"
              bottom={20}
              right={20}
              w="150px"
              h="200px"
              borderRadius="lg"
              overflow="hidden"
              border="3px solid #6600CC"
            >
              <video
                ref={localVideoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
                autoPlay
                muted
                playsInline
              />
            </Box>

            {/* Call Info */}
            <Box
              position="absolute"
              top={20}
              left="50%"
              transform="translateX(-50%)"
              textAlign="center"
              color="#F2F2F5"
            >
              <Text fontSize="lg" fontWeight="bold">
                {otherUserData?.name}
              </Text>
              <Text fontSize="sm" opacity={0.8}>
                {callDuration}
              </Text>
            </Box>

            {/* Call Controls */}
            <HStack
              position="absolute"
              bottom={30}
              left="50%"
              transform="translateX(-50%)"
              spacing={4}
            >
              <Button
                onClick={toggleMute}
                bg={isMuted ? "#E53535" : "#6600CC"}
                color="#F2F2F5"
                _hover={{ bg: isMuted ? "#FF3B3B" : "#4D0099" }}
                borderRadius="full"
                size="lg"
                icon={isMuted ? <MicOffIcon /> : <MicIcon />}
              >
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </Button>

              <Button
                onClick={toggleVideo}
                bg={!isVideoOn ? "#E53535" : "#6600CC"}
                color="#F2F2F5"
                _hover={{ bg: !isVideoOn ? "#FF3B3B" : "#4D0099" }}
                borderRadius="full"
                size="lg"
              >
                {isVideoOn ? <VideocamIcon /> : <VideocamOffIcon />}
              </Button>

              <Button
                onClick={handleEndCall}
                bg="#E53535"
                color="#F2F2F5"
                _hover={{ bg: "#FF3B3B" }}
                borderRadius="full"
                size="lg"
                leftIcon={<CallEndIcon />}
              >
                End Call
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // Audio Call Interface
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent
        bg="linear-gradient(147.14deg, #28293D 0%, #1a1b2e 100%)"
        color="#F2F2F5"
        borderColor="#555770"
        borderWidth="1px"
        borderRadius="lg"
        p={6}
      >
        <ModalBody display="flex" flexDir="column" alignItems="center" justifyContent="center">
          <Avatar
            size="2xl"
            name={otherUserData?.name}
            src={otherUserData?.pic}
            mb={6}
          />
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            {otherUserData?.name}
          </Text>
          <Text fontSize="lg" mb={8} opacity={0.8}>
            {callDuration}
          </Text>

          <HStack spacing={6} mb={6}>
            <Button
              onClick={toggleMute}
              bg={isMuted ? "#E53535" : "#6600CC"}
              color="#F2F2F5"
              _hover={{ bg: isMuted ? "#FF3B3B" : "#4D0099" }}
              borderRadius="full"
              size="lg"
              icon={isMuted ? <MicOffIcon /> : <MicIcon />}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </Button>

            <Button
              onClick={handleEndCall}
              bg="#E53535"
              color="#F2F2F5"
              _hover={{ bg: "#FF3B3B" }}
              borderRadius="full"
              size="lg"
              leftIcon={<CallEndIcon />}
            >
              End Call
            </Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CallInterface;
