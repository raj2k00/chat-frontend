import React, { createContext, useReducer, useContext } from "react";

const MessageStateContext = createContext();
const MessageDispatchContext = createContext();

// Defining Message Reducer actions via switch
const messageReducer = (state, action) => {
  let usersCopy, userIndex;
  const { username, message, messages } = action.payload;
  switch (action.type) {
    // setting users after login successfully (displaying all the users of the system)
    case "SET_USERS":
      return {
        ...state,
        users: action.payload,
      };
    //once specific user is selected display their messages
    case "SET_USER_MESSAGES":
      usersCopy = [...state.users];

      userIndex = usersCopy.findIndex((u) => u.username === username);

      usersCopy[userIndex] = { ...usersCopy[userIndex], messages };

      return {
        ...state,
        users: usersCopy,
      };
    // set the select user
    case "SET_SELECTED_USER":
      usersCopy = state.users.map((user) => ({
        ...user,
        selected: user.username === action.payload,
      }));

      return {
        ...state,
        users: usersCopy,
      };
    // adding new messages
    case "ADD_MESSAGE":
      usersCopy = [...state.users];

      userIndex = usersCopy.findIndex((u) => u.username === username);

      let newUser = {
        ...usersCopy[userIndex],
        messages: usersCopy[userIndex].messages
          ? [message, ...usersCopy[userIndex].messages]
          : null,
        latestMessage: message,
      };

      usersCopy[userIndex] = newUser;

      return {
        ...state,
        users: usersCopy,
      };

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};
// exporting message context

export const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, { users: null });

  return (
    <MessageDispatchContext.Provider value={dispatch}>
      <MessageStateContext.Provider value={state}>
        {children}
      </MessageStateContext.Provider>
    </MessageDispatchContext.Provider>
  );
};

export const useMessageState = () => useContext(MessageStateContext);
export const useMessageDispatch = () => useContext(MessageDispatchContext);
