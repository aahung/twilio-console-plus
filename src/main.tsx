import React from "react";

import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import debounce from "debounce";
import InspectResourceButton from "./components/inspect-resource-button";
import { createTwilioResourceFromUrl } from "./twilio-resource-loaders";
import AccountInfoBanner from "./components/account-info-banner";
import { QUERY_CLIENT } from "./query-client";
import GlobalSearchBar from "./components/global-search-bar";

const resetContainer = () => {
  const oldContainer = document.querySelector("#pt-container");
  if (oldContainer) {
    oldContainer.remove();
  }
  const container = document.createElement("div");
  container.id = "pt-container";
  document.body.append(container);
  return container;
};

const setupAccountBannerAndGlobalSearchBar = () => {
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
      <QueryClientProvider client={QUERY_CLIENT}>
        <div>
          <GlobalSearchBar />
          <AccountInfoBanner />
        </div>
      </QueryClientProvider>,
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
  for (const link of links) {
    const twilioResource = createTwilioResourceFromUrl(link.href);
    if (twilioResource) {
      const parent = link.parentElement;
      const ptContainer = parent.querySelector(".pt-root");
      if (!ptContainer) {
        const span = document.createElement("span");
        span.classList.add("pt-root");
        link.before(span);
        createRoot(span).render(
          <QueryClientProvider client={QUERY_CLIENT}>
            <InspectResourceButton resource={twilioResource} />
          </QueryClientProvider>,
        );
      }
    }
  }
}, 300);

window.addEventListener("load", () => {
  setupAccountBannerAndGlobalSearchBar();
  const observer = new MutationObserver(domMutateCallback);
  observer.observe(document.body, { childList: true, subtree: true });
});
