import React from "react";
import { useQuery } from "@tanstack/react-query";
import Downshift from "downshift";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import styled from "styled-components";

const ClickableLi = styled.li`
  cursor: pointer;
`;
interface Subaccount {
  sid: string;
  friendlyName: string;
}

const listAllSubaccounts = async (nextToken: string): Promise<Subaccount[]> => {
  const params: Record<string, string> = {
    PageSize: "25",
  };
  if (nextToken) {
    params.PageToken = nextToken;
  }
  const response = await fetch(
    "https://www.twilio.com/console/account/api/v2/subaccounts?" +
      new URLSearchParams(params),
    {
      credentials: "include",
    },
  );
  const responseBody = await response.json();
  if (responseBody?.meta?.next_token) {
    return [
      ...responseBody.content,
      ...(await listAllSubaccounts(responseBody.meta.next_token)),
    ];
  }
  return responseBody.content;
};

const SubaccountSelector = () => {
  const {
    isPending,
    error,
    data: items,
  } = useQuery({
    queryKey: ["listSubaccounts"],
    queryFn: () => listAllSubaccounts(undefined),
  });
  if (error) {
    return <span>ERROR: {error.message}</span>;
  }
  return (
    <Popup trigger={<button disabled={isPending}>Switch account</button>} modal>
      <div>
        <Downshift
          onChange={(selection) => {
            console.log("Switching to", selection.sid);
            fetch(
              "	https://www.twilio.com/console/account/api/v2/switch/" +
                selection.sid,
              { credentials: "include" },
            ).then(() => window.location.reload());
          }}
          itemToString={(item) => (item ? item.sid : "")}
          defaultIsOpen
        >
          {({
            getInputProps,
            getItemProps,
            getLabelProps,
            getMenuProps,
            isOpen,
            inputValue,
            highlightedIndex,
            selectedItem,
            getRootProps,
          }) => (
            <div>
              <label {...getLabelProps()}>Search subaccount: </label>
              <div
                style={{ display: "inline-block" }}
                {...getRootProps({}, { suppressRefError: true })}
              >
                <input {...getInputProps()} />
              </div>
              <ul {...getMenuProps()}>
                {isOpen
                  ? (items || [])
                      .filter(
                        (item) =>
                          !inputValue ||
                          item.sid.includes(inputValue) ||
                          item.friendlyName.includes(inputValue),
                      )
                      .map((item, index) => (
                        <ClickableLi
                          key={item.sid}
                          {...getItemProps({
                            key: item.sid,
                            index,
                            item,
                            style: {
                              backgroundColor:
                                highlightedIndex === index
                                  ? "lightgray"
                                  : "white",
                              fontWeight:
                                selectedItem === item ? "bold" : "normal",
                            },
                          })}
                        >
                          {item.sid} - {item.friendlyName}
                        </ClickableLi>
                      ))
                  : null}
              </ul>
            </div>
          )}
        </Downshift>
      </div>
    </Popup>
  );
};

export default SubaccountSelector;
