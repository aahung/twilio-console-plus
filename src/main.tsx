import React from "react";

import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import debounce from "debounce";
import InspectResourceButton from "./components/InspectResourceButton";
import { createTwilioResourceFromUrl } from "./twilio-resource-loaders";
import AccountInfoBanner from "./components/AccountInfoBanner";
import { QUERY_CLIENT } from "./query-client";

const resetContainer = () => {
  const oldContainer = document.querySelector("#pt-container");
  if (oldContainer) {
    document.removeChild(oldContainer);
  }
  const container = document.createElement("div");
  container.id = "pt-container";
  document.body.appendChild(container);
  return container;
};

const setupAccountBanner = () => {
  fetch("https://www.twilio.com/console/api/v2/projects/info", {
    credentials: "include",
  }).then(async (response) => {
    const accountInfo = await response.json();
    const accountSid = accountInfo["projectSid"];
    const authToken = accountInfo["authToken"];
    window.ptTwilioCreds = { accountSid, authToken };

    const container = resetContainer();
    const root = createRoot(container);
    root.render(
      <AccountInfoBanner accountSid={accountSid} authToken={authToken} />,
    );
  });
};

const domMutateCallback: MutationCallback = (mutationList) => {
  if (mutationList.some((mutation) => mutation.addedNodes.length > 0)) {
    setupResourceDetailInfoButtons();
  }
};

const setupResourceDetailInfoButtons = debounce(() => {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    const twilioResource = createTwilioResourceFromUrl(link.href);
    if (twilioResource) {
      const parent = link.parentElement;
      const ptContainer = parent.querySelector(".pt-root");
      if (!ptContainer) {
        const div = document.createElement("div");
        div.classList.add("pt-root");
        parent.appendChild(div);
        createRoot(div).render(
          <QueryClientProvider client={QUERY_CLIENT}>
            <InspectResourceButton resource={twilioResource} />
          </QueryClientProvider>,
        );
      }
    }
  });
}, 300);

window.addEventListener("load", () => {
  setupAccountBanner();
  const observer = new MutationObserver(domMutateCallback);
  observer.observe(document.body, { childList: true, subtree: true });
});
