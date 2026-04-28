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
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";

const CallInterfaceWithRTC = ({
  isOpen,
  onClose,
  callType,
  otherUserData,
  onEndCall,
  callDuration,
  socket,
  userId,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === "video");
  const toast = useToast();

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    if (!isOpen) return;

    const initializeCall = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });

        localStreamRef.current = stream;

        if (callType === "video" && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize peer connection
        peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

        // Add local stream tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && callType === "video") {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("send ice candidate", {
              to: otherUserData?._id,
              candidate: event.candidate,
            });
          }
        };

        // Send offer
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit("send offer", {
          to: otherUserData?._id,
          offer,
        });

        toast({
          title: "Call Started",
          description: "Connecting to peer...",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        console.error("Error initializing call:", err);
        toast({
          title: "Permission Error",
          description:
            "Please allow microphone/camera access to make a call",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        onClose();
      }
    };

    initializeCall();

    // Socket listeners for WebRTC
    const handleReceiveOffer = async (data) => {
      try {
        if (!peerConnectionRef.current) {
          peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

          const stream = localStreamRef.current;
          stream.getTracks().forEach((track) => {
            peerConnectionRef.current.addTrack(track, stream);
          });

          peerConnectionRef.current.ontrack = (event) => {
            if (remoteVideoRef.current && callType === "video") {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          };

          peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("send ice candidate", {
                to: otherUserData?._id,
                candidate: event.candidate,
              });
            }
          };
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit("send answer", {
          to: otherUserData?._id,
          answer,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const handleReceiveAnswer = async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    const handleReceiveIceCandidate = async (data) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    socket.on("receive offer", handleReceiveOffer);
    socket.on("receive answer", handleReceiveAnswer);
    socket.on("receive ice candidate", handleReceiveIceCandidate);

    return () => {
      socket.off("receive offer", handleReceiveOffer);
      socket.off("receive answer", handleReceiveAnswer);
      socket.off("receive ice candidate", handleReceiveIceCandidate);
    };
  }, [isOpen, callType, otherUserData, socket, toast]);

  const handleEndCall = () => {
    // Stop all local streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    onEndCall();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
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
              autoPlay
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

export default CallInterfaceWithRTC;
