import { IconButton, Tooltip } from "@chakra-ui/react";
import PhoneIcon from "@mui/icons-material/Phone";
import VideocamIcon from "@mui/icons-material/Videocam";

const CallButton = ({ onAudioCall, onVideoCall, isDisabled }) => {
  return (
    <>
      <Tooltip label="Audio Call" placement="bottom" hasArrow>
        <IconButton
          icon={<PhoneIcon />}
          onClick={onAudioCall}
          isDisabled={isDisabled}
          bg="linear-gradient(147.14deg, #FF3B3B 6.95%, #6600CC 93.05%)"
          color="#F2F2F5"
          _hover={{ bg: "#6600CC", transform: "scale(1.05)" }}
          _active={{ transform: "scale(0.95)" }}
          size="md"
          borderRadius="full"
          transition="all 0.2s"
        />
      </Tooltip>

      <Tooltip label="Video Call" placement="bottom" hasArrow>
        <IconButton
          icon={<VideocamIcon />}
          onClick={onVideoCall}
          isDisabled={isDisabled}
          bg="linear-gradient(147.14deg, #FF3B3B 6.95%, #6600CC 93.05%)"
          color="#F2F2F5"
          _hover={{ bg: "#6600CC", transform: "scale(1.05)" }}
          _active={{ transform: "scale(0.95)" }}
          size="md"
          borderRadius="full"
          transition="all 0.2s"
        />
      </Tooltip>
    </>
  );
};

export default CallButton;
