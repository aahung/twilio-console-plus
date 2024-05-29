import React, { useState } from "react";
import { CopyBlock, dracula } from "react-code-blocks";
import { useQuery } from "@tanstack/react-query";
import { TwilioResource } from "../twilio-resources";
import { Tooltip } from "react-tooltip";
import Modal from "./modal";

interface InspectResourceButtonProperties {
  resource: TwilioResource;
}

const InspectResourceButton: React.FC<InspectResourceButtonProperties> = ({
  resource,
}) => {
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const openModal = () => setOpen(true);
  return (
    <>
      <button className={`inspect-${resource.sid}`} onClick={openModal}>
        Inspect
      </button>
      <Tooltip anchorSelect={`.inspect-${resource.sid}`} place="top">
        Click to inspect {resource.getName()}
      </Tooltip>
      <Modal open={open} onClose={closeModal}>
        <ResourceDetailView resource={resource} />
      </Modal>
    </>
  );
};

interface ResourceDetailViewProperties {
  resource: TwilioResource;
}

export const ResourceDetailView: React.FC<ResourceDetailViewProperties> = ({
  resource,
}) => {
  const apiUrl = resource.getApiUrl();
  const { isPending, error, data } = useQuery({
    queryKey: ["getResource", apiUrl],
    queryFn: () => resource.getObject(),
  });

  const { data: relatedResources } = useQuery({
    queryKey: ["getRelatedResources", apiUrl],
    queryFn: () => resource.getRelatedResources(),
  });

  const { data: relatedLinks } = useQuery({
    queryKey: ["getRelatedLinks", apiUrl],
    queryFn: () => resource.getRelatedLinks(),
  });

  const codeSnippet = `curl -X GET ${apiUrl} \\
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN`;

  if (isPending) {
    return <p>Loading</p>;
  }
  if (data) {
    return (
      <div style={{ fontFamily: "monospace" }}>
        <h3>{resource.getName()}</h3>
        <h4>cURL command:</h4>
        <CopyBlock
          text={codeSnippet}
          language="shell"
          theme={dracula}
          showLineNumbers
          codeBlock
        />
        <h4>Response:</h4>
        <CopyBlock
          text={JSON.stringify(data, undefined, 2)}
          language="json"
          theme={dracula}
          showLineNumbers
          codeBlock
        />
        {relatedLinks &&
          relatedLinks.map((link) => (
            <div key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </div>
          ))}
        <h4>Related resources:</h4>
        {relatedResources?.length === 0 && <p>No related resources found.</p>}
        <ul>
          {relatedResources &&
            relatedResources.map((relatedResource, index) => (
              <li key={index}>
                <ResourceNameLabel resource={relatedResource} />{" "}
                <InspectResourceButton resource={relatedResource} />
              </li>
            ))}
        </ul>
      </div>
    );
  }
  if (error) {
    return <p>ERROR: {error.message}</p>;
  }
  return <p>Unexpected state</p>;
};

interface ResourceNameLabelProperties {
  resource: TwilioResource;
}

const ResourceNameLabel: React.FC<ResourceNameLabelProperties> = ({
  resource,
}) => {
  const { data: fullName } = useQuery({
    queryKey: ["getFullName", resource.sid],
    queryFn: () => resource.getFullName(),
  });

  return <span>{fullName ?? resource.getName()}</span>;
};

export default InspectResourceButton;
