import React, { Fragment, useEffect, useState } from "react";
import { gql, useLazyQuery, useMutation, InMemoryCache } from "@apollo/client";
import { Col, Form } from "react-bootstrap";
import { useMessageDispatch, useMessageState } from "../../context/message";
import uuid from "react-uuid";
import Message from "./Message";

// graphql query for sending message
const SEND_MESSAGE = gql`
  mutation sendMessage($uuid: String, $to: String!, $content: String!) {
    sendMessage(uuid: $uuid, to: $to, content: $content) {
      uuid
      from
      to
      content
      createdAt
      hasSeen
      hasSent
    }
  }
`;

// graphql query for receving message
const GET_MESSAGES = gql`
  query getMessages($from: String!) {
    getMessages(from: $from) {
      uuid
      from
      to
      content
      createdAt
      hasSeen
    }
  }
`;

export default function Messages() {
  const { users } = useMessageState();
  const dispatch = useMessageDispatch();
  const [content, setContent] = useState("");

  const selectedUser = users?.find((u) => u.selected === true);
  const messages = selectedUser?.messages;

  const [getMessages, { loading: messagesLoading, data: messagesData }] =
    useLazyQuery(GET_MESSAGES, {
      update(cache) {
        cache.readFragment({});
        console.log("reading");
      },
    });

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    update(cache, { data: { sendMessage } }) {
      cache.modify({
        fields: {
          getMessages(existingMsg) {
            console.log(existingMsg);
            const newMsgRef = cache.writeFragment({
              data: sendMessage,
              fragment: gql`
                fragment sendNewMessage on Mutation {
                  uuid
                  to
                  from
                  content
                  hasSeen
                  hasSent
                }
              `,
            });
            return existingMsg.push(newMsgRef);
          },
        },
      });
    },
    onError: (err) => console.log(err),
  });

  useEffect(() => {
    if (selectedUser && !selectedUser.messages) {
      getMessages({ variables: { from: selectedUser.username } });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (messagesData) {
      dispatch({
        type: "SET_USER_MESSAGES",
        payload: {
          username: selectedUser.username,
          messages: messagesData.getMessages,
        },
      });
    }
  }, [messagesData]);

  const submitMessage = (e) => {
    e.preventDefault();
    if (content.trim() === "" || !selectedUser) return;
    //removing the value after sending
    let id = uuid();
    // console.log(id);

    sendMessage({
      variables: { uuid: id, to: selectedUser.username, content },
      optimisticResponse: {
        sendMessage: {
          __typename: "Mutation",
          uuid: id,
          from: "User",
          to: selectedUser.username,
          content,
          hasSent: false,
          hasSeen: false,
          createdAt: Date.now(),
        },
      },
    });

    setContent("");
  };

  // Displaying helper text and styling
  let selectedChatMarkup;
  if (!messages && !messagesLoading) {
    selectedChatMarkup = <p className="info-text"> Select a friend</p>;
  } else if (messagesLoading) {
    selectedChatMarkup = <p className="info-text"> Loading..</p>;
  } else if (messages.length > 0) {
    selectedChatMarkup = messages.map((message, index) => (
      <Fragment key={message.uuid}>
        <Message message={message} />
        {index === messages.length - 1 && (
          <div className="invisible">
            <hr className="m-0" />
          </div>
        )}
      </Fragment>
    ));
  } else if (messages.length === 0) {
    selectedChatMarkup = (
      <p className="info-text">
        You are now connected! send your first message!
      </p>
    );
  }

  return (
    <Col xs={10} md={8}>
      <div className="messages-box d-flex flex-column-reverse">
        {selectedChatMarkup}
      </div>
      <div>
        <Form onSubmit={submitMessage}>
          <Form.Group className="d-flex align-items-center">
            <Form.Control
              type="text"
              className="message-input rounded-pill p-4 bg-secondary border-0"
              placeholder="Type a message.."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <i
              className="fas fa-regular fa-paper-plane fa-2x text-primary ml-2"
              onClick={submitMessage}
              role="button"
            ></i>
          </Form.Group>
        </Form>
      </div>
    </Col>
  );
}
