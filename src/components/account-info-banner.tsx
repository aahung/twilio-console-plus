import "react-tooltip/dist/react-tooltip.css";

import React from "react";
import styled from "styled-components";
import SubaccountSelector from "./subaccount-selector";
import { Tooltip } from "react-tooltip";

interface ClickToCopySpanProperties {
  children: string;
  mask?: boolean;
}

const ClickToCopySpan: React.FC<ClickToCopySpanProperties> = ({
  children,
  mask,
}) => {
  return (
    <span
      data-tooltip-id="pt-tooltip"
      data-tooltip-content="Click to copy"
      onClick={() => {
        navigator.clipboard.writeText(children);
      }}
    >
      {mask ? "*".repeat(children.length) : children}
    </span>
  );
};

const AccountInfoBannerDiv = styled.div`
  position: fixed;
  top: 0.2rem;
  left: 0;
  right: 0;
  padding: 0.1rem;
  margin: auto;
  background-color: black;
  color: white;
`;

const AccountInfoBanner: React.FC = () => {
  const { accountSid, authToken } = window.ptTwilioCreds;
  return (
    <div>
      <AccountInfoBannerDiv>
        Current subaccount SID: <ClickToCopySpan>{accountSid}</ClickToCopySpan>{" "}
        Auth Token: <ClickToCopySpan mask>{authToken}</ClickToCopySpan>{" "}
        <SubaccountSelector />
      </AccountInfoBannerDiv>
      <Tooltip id="pt-tooltip" />
    </div>
  );
};

export default AccountInfoBanner;
