import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Avatar,
  Box,
  Text,
  HStack,
} from "@chakra-ui/react";
import PhoneIcon from "@mui/icons-material/Phone";
import CallEndIcon from "@mui/icons-material/CallEnd";

const IncomingCallModal = ({
  isOpen,
  onClose,
  callerData,
  onAccept,
  onReject,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent
        bg="#28293D"
        color="#F2F2F5"
        borderColor="#555770"
        borderWidth="1px"
        borderRadius="lg"
        p={6}
      >
        <ModalBody display="flex" flexDir="column" alignItems="center" justifyContent="center">
          <Avatar
            size="2xl"
            name={callerData?.callerName}
            src={callerData?.callerPic}
            mb={4}
          />
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            {callerData?.callerName}
          </Text>
          <Text fontSize="md" mb={6} opacity={0.8}>
            is calling you...
          </Text>

          <HStack spacing={4}>
            <Button
              leftIcon={<PhoneIcon />}
              onClick={onAccept}
              bg="linear-gradient(147.14deg, #4CAF50 6.95%, #45a049 93.05%)"
              color="#F2F2F5"
              _hover={{ bg: "#45a049" }}
              size="lg"
              borderRadius="full"
              px={8}
            >
              Accept
            </Button>
            <Button
              leftIcon={<CallEndIcon />}
              onClick={onReject}
              bg="#E53535"
              color="#F2F2F5"
              _hover={{ bg: "#FF3B3B" }}
              size="lg"
              borderRadius="full"
              px={8}
            >
              Reject
            </Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default IncomingCallModal;
