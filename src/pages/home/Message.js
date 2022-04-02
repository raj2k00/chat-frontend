import React, { useState, useEffect } from "react";
import classNames from "classnames";
import moment from "moment";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import { useAuthState } from "../../context/auth";
import { gql, useMutation, useSubscription } from "@apollo/client";

const SEEN_MESSAGE = gql`
  mutation readMessage($uuid: String!, $hasSeen: Boolean!) {
    readMessage(uuid: $uuid, hasSeen: $hasSeen) {
      content
      uuid
      hasSeen
    }
  }
`;

const MSG_STATUS = gql`
  subscription seenMessage {
    seenMessage {
      hasSeen
      uuid
      to
      from
      uuid
      content
    }
  }
`;

export default function Message({ message }) {
  const { user } = useAuthState();
  const [msgStatus, setmsgStatus] = useState(message.hasSeen);
  const sent = message.from === user.username;
  const received = !sent;

  const [readMessage] = useMutation(SEEN_MESSAGE, {
    onError: (err) => console.log(err),
    onCompleted: (data) => {
      console.log("Mutation executed", data);
    },
  });

  const { data: statusData, error: statusError } = useSubscription(MSG_STATUS);

  useEffect(() => {
    if (statusError) console.log(statusError);
    if (statusData) {
      setmsgStatus(true);
    }
  }, [statusData, statusError, message.hasSeen]);

  const statusView = (
    <p>
      <i
        className={`fas icon-edit ${
          msgStatus ? `fa-check-double` : `fa-check`}
         `}
      ></i>
    </p>
  );

  useEffect(() => {
    if (message.hasSeen) return;
    if (!message.hasSeen)
      if (message.to === user.username) {
        // console.log(
        //   "mutation effect executed for this message",
        //   message.content
        // );
        readMessage({ variables: { uuid: message.uuid, hasSeen: true } });
      }
  }, []);

  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip>
          {moment(message.createdAt).format("MMMM DD, YYYY @ h:mm a")}
        </Tooltip>
      }
      transition={true}
    >
      <div
        className={classNames("d-flex my-3 align-items-end", {
          "ml-auto": sent,
          "mr-auto": received,
        })}
      >
        <div
          className={classNames("d-flex py-2 px-3 rounded-pill", {
            "bg-primary": sent,
            "bg-secondary": received,
          })}
        >
          <p className={classNames({ "text-white": sent })} key={message.uuid}>
            {message.content}
          </p>
        </div>
        {sent && statusView}
      </div>
    </OverlayTrigger>
  );
}
