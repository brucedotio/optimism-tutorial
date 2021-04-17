pragma solidity >0.6.0 <0.8.0;

contract ICrossDomainMessenger {
    address public xDomainMessageSender;
}

contract SimpleStorage {
    address public msgSender;
    address public xDomainSender;
    bytes32 public value;
    uint256 public totalCount;

    constructor() {
      value = '0x6173646173';
    }
    function setValue(bytes32 newValue) public {
        msgSender = msg.sender;
        xDomainSender = ICrossDomainMessenger(msg.sender)
            .xDomainMessageSender();
        value = newValue;
        totalCount++;
    }

    function dumbSetValue(bytes32 newValue) public {
        value = newValue;
    }
}
