import React, { useState } from "react";
import Popup from "reactjs-popup";
import { CopyBlock, dracula } from "react-code-blocks";
import { useQuery } from "@tanstack/react-query";
import { TwilioResource } from "../twilio-resources";
import styled from "styled-components";

const PopupContainer = styled.div`
  .close {
    text-align: center;
    cursor: pointer;
    background-color: red;
    color: white;
    padding: 0.5rem;
  }
  .content {
    max-height: 90vh;
    overflow-y: scroll;
  }
`;

interface InspectResourceButtonProps {
  resource: TwilioResource;
}

const InspectResourceButton: React.FC<InspectResourceButtonProps> = ({
  resource,
}) => {
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const openModal = () => setOpen(true);
  return (
    <>
      <button onClick={openModal}>Inspect</button>
      <Popup
        open={open}
        modal
        closeOnDocumentClick={false}
        onClose={closeModal}
      >
        <PopupContainer>
          <div className="close" onClick={closeModal}>
            Close
          </div>
          <div className="content">
            <ResourceDetailView resource={resource} />
          </div>
        </PopupContainer>
      </Popup>
    </>
  );
};

interface ResourceDetailViewProps {
  resource: TwilioResource;
}

const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({
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
          text={JSON.stringify(data, null, 2)}
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
            relatedResources.map((relatedResource, i) => (
              <li key={i}>
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

interface ResourceNameLabelProps {
  resource: TwilioResource;
}

const ResourceNameLabel: React.FC<ResourceNameLabelProps> = ({ resource }) => {
  const { data: fullName } = useQuery({
    queryKey: ["getFullName", resource.sid],
    queryFn: () => resource.getFullName(),
  });

  return <span>{fullName ?? resource.getName()}</span>;
};

export default InspectResourceButton;
