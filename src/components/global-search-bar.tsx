import React from "react";

import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { createTwilioResourceFromSid } from "../twilio-resource-loaders";
import { ResourceDetailView } from "./inspect-resource-button";
import Modal from "./modal";
import { FaBeer } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { useHotkeys } from "react-hotkeys-hook";

const SearchBarContainer = styled.div`
  top: 0;
  position: sticky;
  width: 100%;
  padding: 5px;
  background-color: white;
  z-index: 1;
`;

const SearchBar = styled.input`
  width: 100%;
  font-size: 1.5rem;
`;

const ResultContainer = styled.div`
  margin-top: 5px;
`;

const TriggerButton = styled.div`
  position: fixed;
  bottom: 50px;
  right: 50px;
  z-index: 1;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 15px;
  text-align: center;
  cursor: pointer;
`;

const GlobalSearchBar: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  const [searchQuery, setSearchQuery] = React.useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const ready = searchQuery.length === 34;

  const { isFetching, data } = useQuery({
    queryKey: ["getResource", searchQuery],
    queryFn: () => createTwilioResourceFromSid(searchQuery),
    enabled: ready,
  });

  useHotkeys(
    "q",
    () => {
      setSearchQuery("");
      openModal();
    },
    { preventDefault: true },
  );

  return (
    <>
      <TriggerButton
        className="pt-global-search-trigger-button"
        onClick={openModal}
      >
        <FaBeer />
      </TriggerButton>
      <Tooltip anchorSelect={".pt-global-search-trigger-button"} place="top">
        Quick inspect any resource (Q)
      </Tooltip>
      <Modal open={open} onClose={closeModal}>
        <div>
          <SearchBarContainer>
            <SearchBar
              autoFocus
              onChange={handleChange}
              value={searchQuery}
              placeholder="Input a 34-char resource SID here"
            />
          </SearchBarContainer>
          <ResultContainer>
            {isFetching && <p>Loading...</p>}
            {ready &&
              !isFetching &&
              (data ? (
                <ResourceDetailView resource={data} />
              ) : (
                <p>Not found</p>
              ))}
          </ResultContainer>
        </div>
      </Modal>
    </>
  );
};

export default GlobalSearchBar;
