import "react-tooltip/dist/react-tooltip.css";

import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import styled from "styled-components";
import SubaccountSelector from "./SubaccountSelector";
import { Tooltip } from "react-tooltip";
import { QUERY_CLIENT } from "../query-client";

interface ClickToCopySpanProps {
  children: string;
  mask?: boolean;
}

const ClickToCopySpan: React.FC<ClickToCopySpanProps> = ({
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

interface AccountInfoBannerProps {
  accountSid: string;
  authToken: string;
}

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

const AccountInfoBanner: React.FC<AccountInfoBannerProps> = ({
  accountSid,
  authToken,
}) => {
  return (
    <QueryClientProvider client={QUERY_CLIENT}>
      <div>
        <AccountInfoBannerDiv>
          Current subaccount SID:{" "}
          <ClickToCopySpan>{accountSid}</ClickToCopySpan> Auth Token:{" "}
          <ClickToCopySpan mask>{authToken}</ClickToCopySpan>{" "}
          <SubaccountSelector />
        </AccountInfoBannerDiv>
        <Tooltip id="pt-tooltip" />
      </div>
    </QueryClientProvider>
  );
};

export default AccountInfoBanner;
